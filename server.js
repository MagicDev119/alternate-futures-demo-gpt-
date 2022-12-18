const express = require("express")
const app = express()
const cors = require("cors")
require("dotenv").config({ path: "./config.env" })
require('./db/conn')
const port = process.env.PORT || 5000
const bodyParser = require('body-parser')
const routes = require('./routes')
const path = require('path')
const http = require('http')
const axios = require('axios')
const server = http.createServer(app)
const jwt = require('jsonwebtoken')
const fs = require("fs")
var pdf = require("pdf-creator-node")
var openai = require("openai-node");
openai.api_key = "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"; // required
// openai.organization = "YOUR ORGANIZATION ID"; // optional
const {
  ADD_VISION,
  GET_VISION_STATUS,
  SAVE_VISOINDATA
} = require('./actions/socketio')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use("/uploads", express.static(__dirname + '/uploads'));

// app.use(express.static(path.join(__dirname, '../frontend/build')));
app.use(express.static(path.join(__dirname, 'build')));

app.use('/api', routes)

app.get('/**', function (req, res) {
  // res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.use(function (req, res) {
  res.status(404).send({ url: req.originalUrl + ' not found' })
})

app.use((err, req, res, next) => {
  res.status(500).json(err)
})

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
})

function getPrompt(descrip) {
  const frames = [0, 50, 100, 150, 200]
  let promptStr = ""
  const description = "Magic realism octane render by robert hubert and weta digital, futuristic, " + descrip + ", lush vegetation, vibrant Simon Stålenhag and beeple and James Gilleard and Justin Gerard ornate, dynamic, particulate, sunny, intricate, elegant, highly detailed, centered, artstation, smooth, sharp focus, octane render, 3d, raytraced lighting"

  frames.map(each => {
    promptStr += each + ": " + description + " | "
  })

  return promptStr.slice(0, -3)
}

function getVersion2Prompt(username, inputtext, inputaudio) {
  const frames = [0, 50, 100, 150, 200]
  let promptStr = ""

  const description = "Write a compelling, realistic story about a person named " + username + " who is an expert in " + inputtext + ". This story takes place in a not-so-distant future where " + username + " made critical contributions towards creating a world where " + inputaudio + ", and doing so made a massive, positive impact in helping humanity solve the climate crisis. Detail the contributions that only " + username + ", given his skillset, could have made to creating a world where " + inputaudio + "."

  frames.map(each => {
    promptStr += each + ": " + description + " | "
  })

  return promptStr.slice(0, -3)
}

function getOpenaiPrompt(username, inputtext, inputaudio) {
  const description = "Write a compelling, realistic story about a person named " + username + " who is an expert in " + inputtext + ". This story takes place in a not-so-distant future where " + username + " made critical contributions towards creating a world where " + inputaudio + ", and doing so made a massive, positive impact in helping humanity solve the climate crisis. Detail the contributions that only " + username + ", given his skillset, could have made to creating a world where " + inputaudio + "."

  return description
}

function getOpenai2Prompt(username, userprofession, userhobbies, passions, gpt_output) {
  const description = "Write a detailed, realistic, socio-politically, scientifically, and technologically validated step-by-step action plan (include a schedule, cost, and resource estimates along with instructions and suggestions for how to accomplish each step) for " + username + ", who is skilled in " + userprofession + " , " + userhobbies + ", and passionate about " + passions + " to actualize what this story describes: " + gpt_output

  return description
}

io.on('connection', (socket) => {
  socket.socketTimer = setInterval(() => {
    if (socket.isProcessing) {
      socket.progressTimer = (socket.progressTimer || 1) + 1
    } else {
      socket.progressTimer = 1
    }

    // console.log(socket.isProcessing)
    // console.log('-' + socket.progressTimer)
    socket.emit('changeTimer', socket.progressTimer)
  }, 1000)

  socket.on('connected', async (data) => {
    socket.token = data.token
    if (!socket.isProcessing) {
      jwt.verify(data.token, process.env.JWT_SECRET, async function (err, decoded) {
        if (!err) {
          const userInfo = decoded
          const data = {
            userId: userInfo.id
          }
          const visionStatus = await GET_VISION_STATUS(data)
          if (visionStatus.visionStatus.isProcessing) {
            socket.isProcessing = visionStatus.visionStatus.isProcessing
            socket.progressTimer = visionStatus.visionStatus.progressTimer + parseInt(((new Date()).getTime() - visionStatus.visionStatus.curTime) / 1000)
            socket.visionData = visionStatus.visionStatus.visionData
            socket.emit('setVisionData', {
              description: visionStatus.visionStatus.visionData.description,
              type: visionStatus.visionStatus.visionData.type,
              processing: 'working'
            })
          }
        }
      })
    }
  })
  socket.on('message', async (data) => {
    if (data.token) {

      if (!data.description || data.description === '') {
        return
      }
      if (socket.isProcessing) {
        socket.emit('error', {
          msg: 'Vision is generating.'
        })
        return
      }

      jwt.verify(data.token, process.env.JWT_SECRET, async function (err, decoded) {
        if (err) {
          socket.isProcessing = false;
          socket.visionData = {}
          socket.emit('error', err)
          return
        }
        socket.isProcessing = true;
        socket.visionData = {
          description: data.description,
          type: data.type ? data.type : 'single'
        }
        const userInfo = decoded
        console.log(userInfo)

        let payload = {
          "max_frames": 200,
          "animation_prompts": getPrompt(data.description),
          "angle": "0:(0)",
          "zoom": "0: (1.04)",
          "translation_x": "0: (0)",
          "translation_y": "0: (0)",
          "color_coherence": "Match Frame 0 LAB",
          "sampler": "plms",
          "fps": 10,
          "token": "421d2c52165bb776513e47d65d3d4b57"
        }
        console.log(payload)
        let res = await axios.post('https://sdv.alternatefutures.com/api/txt2video_concurrent', payload)
        let base64 = res.data.base64
        console.log('generate finished')
        if (base64) {
          base64 = base64.replace(/^data:(.*?)base64,/, "")
          base64 = base64.replace(/ /g, '+')
          const curTime = (new Date()).getTime()
          const fileName = './uploads/' + curTime + '.mp4'
          let thumbnailData = res.data.thumbnail
          thumbnailData = thumbnailData ? thumbnailData.replace(/^data:(.*?)base64,/, "") : ''
          thumbnailData = thumbnailData ? thumbnailData.replace(/ /g, '+') : ''
          fs.writeFile(fileName, base64, 'base64', async function (err) {
            if (err) {
              socket.isProcessing = false;
              socket.visionData = {}
              socket.emit('error', err)
              let visionSaveData = {
                isProcessing: false,
                progressTimer: 1,
                visionData: {},
                userId: userInfo.id
              }
              await SAVE_VISOINDATA(visionSaveData)
              return
            }
            console.log('done')
            const thumbnailUrl = './uploads/thumbnails/' + curTime + '.png'
            fs.writeFile(thumbnailUrl, thumbnailData, 'base64', async function (err) {
              if (err) {
                socket.isProcessing = false;
                socket.visionData = {}
                let visionSaveData = {
                  isProcessing: false,
                  progressTimer: 1,
                  visionData: {},
                  userId: userInfo.id
                }
                await SAVE_VISOINDATA(visionSaveData)
                socket.emit('error', err)
              }
              console.log('thumbnailData done', userInfo)
              const newVision = await ADD_VISION({
                ...data,
                userInfo,
                description: data.description,
                fileName,
                type: data.type,
                thumbnail_url: thumbnailUrl
              })
              socket.emit('generated', newVision)

              const sockets = await io.fetchSockets();
              sockets.map(eachSocket => {
                if (eachSocket.token && eachSocket.isProcessing) {
                  jwt.verify(socket.token, process.env.JWT_SECRET, async function (err, decoded) {
                    if (decoded.id === userInfo.id) {
                      eachSocket.emit('generated', newVision)
                      eachSocket.isProcessing = false;
                      eachSocket.visionData = {}
                    }
                  })
                }
              })
              socket.isProcessing = false;
              socket.visionData = {}

              let visionSaveData = {
                isProcessing: false,
                progressTimer: 1,
                visionData: {},
                userId: userInfo.id
              }
              await SAVE_VISOINDATA(visionSaveData)
            })
          })
        } else {
          socket.isProcessing = false;
          socket.visionData = {}

          let visionSaveData = {
            isProcessing: false,
            progressTimer: 1,
            visionData: {},
            userId: userInfo.id
          }
          await SAVE_VISOINDATA(visionSaveData)

          socket.emit('error', {
            code: 401,
            msg: 'Unauthorized'
          })
        }
      })
    } else {
      socket.isProcessing = false;
      socket.visionData = {}
      socket.emit('error', {
        code: 401,
        msg: 'Unauthorized'
      })
    }
  })

  socket.on('openai', (data) => {
    openai.Completion.create({
      model: "davinci",
      prompt: getOpenaiPrompt(data.username, data.inputtext, data.inputaudio),
      temperature: 1,
      max_tokens: 64,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 1,
      n: 1,
      stream: false,
      logprobs: null,
      echo: false,
      best_of: 1,
      stop: null,
    }).then((response) => {
      let result = {
        openai1: response
      }
      const gptOutput = (response.choices && response.choices[0]) ? response.choices[0].text : ''
      openai.Completion.create({
        model: "davinci",
        prompt: getOpenai2Prompt(data.username, data.userprofession, data.userhobbies, data.passions, gptOutput),
        temperature: 1,
        max_tokens: 64,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 1,
        n: 1,
        stream: false,
        logprobs: null,
        echo: false,
        best_of: 1,
        stop: null,
      }).then((response2) => {
        result.openai2 = response2
        socket.emit('openai', result)
      })
    });
  })

  socket.on('txt2image', async (data) => {
    if (socket.isTxt2imageProcessing) return;
    socket.isTxt2imageProcessing = true
    let payload = {
      "prompt": "a photo",
      "token": "421d2c52166gg976513e47d65d3d4b57"
    }
    console.log(payload)
    let res;
    try {
      res = await axios.post('http://54.176.111.251/api/txt2img/base64', payload)
    } catch (e) {
      console.log(e)
    }
    let base64 = res ? res.data : undefined
    socket.isTxt2imageProcessing = false

    console.log('Image generated')
    if (base64) {
      console.log('!!!!!!!!!!!!!!!!!!!!Image generated')
      base64 = base64.replace(/^data:(.*?)base64,/, "")
      base64 = base64.replace(/ /g, '+')
      const curTime = (new Date()).getTime()
      const fileName = './uploads/txt2img/' + curTime + '.png'
      fs.writeFile(fileName, base64, 'base64', async function (err) {
        if (err) {
          return
        }
        socket.emit('txt2image', {
          fileName
        })
      })
    }
  })

  socket.on('videogenerate', async (data) => {
    if (socket.isVideoProcessing) return;
    socket.isVideoProcessing = true
    let payload = {
      "max_frames": 200,
      "animation_prompts": getVersion2Prompt(data.username, data.inputtext, data.inputaudio),
      "angle": "0:(0)",
      "zoom": "0: (1.04)",
      "translation_x": "0: (0)",
      "translation_y": "0: (0)",
      "color_coherence": "Match Frame 0 LAB",
      "sampler": "plms",
      "fps": 10,
      "token": "421d2c52165bb776513e47d65d3d4b57"
    }
    let res = await axios.post('https://sdv.alternatefutures.com/api/txt2video_concurrent', payload)
    socket.isVideoProcessing = false
    let base64 = res.data.base64
    console.log('generate finished')
    if (base64) {
      base64 = base64.replace(/^data:(.*?)base64,/, "")
      base64 = base64.replace(/ /g, '+')
      const curTime = (new Date()).getTime()
      const fileName = './uploads/' + curTime + '.mp4'
      let thumbnailData = res.data.thumbnail
      thumbnailData = thumbnailData ? thumbnailData.replace(/^data:(.*?)base64,/, "") : ''
      thumbnailData = thumbnailData ? thumbnailData.replace(/ /g, '+') : ''
      fs.writeFile(fileName, base64, 'base64', async function (err) {
        if (err) {
          return
        }
        console.log('done')
        const thumbnailUrl = './uploads/thumbnails/' + curTime + '.png'
        fs.writeFile(thumbnailUrl, thumbnailData, 'base64', async function (err) {
          if (err) {
            return
          }
          console.log('thumbnailData done')
          socket.emit('generated', {
            fileName,
            thumbnailUrl
          })

        })
      })
    }
  })

  socket.on('generatepdf', (data) => {
    var html = fs.readFileSync("./template/index.html", "utf8");

    var options = {
      format: "A3",
      orientation: "portrait",
      border: "10mm",
      header: {
        height: "10mm",
        contents: '<div style="text-align: center; font-size: 18px;">ALTERNATE FUTURES</div>'
      },
      footer: {
        height: "5mm",
        contents: {
          // first: 'Cover page',
          // 2: 'Second page', // Any page number is working. 1-based index
          default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
          // last: 'Last Page'
        }
      }
    };

    const currentTime = (new Date()).getTime()
    var document = {
      html: html,
      data: {
        imgUrl: 'https://43.206.213.27' + data.imgUrl,
        gpt1txt: data.gpt1txt,
        gpt2txt: data.gpt2txt,
        thumbImgUrl: 'https://43.206.213.27' + data.thumbImgUrl,
        user_passionate: data.passions,
        user_hobbies: data.hobbies,
        user_profession: data.profession,
        username: data.name
      },
      path: "./uploads/pdf/alternate_future_" + currentTime + ".pdf",
      type: "",
    };
    console.log(document)
    pdf
      .create(document, options)
      .then((res) => {
        socket.emit('generatePdf', {
          url: "./uploads/pdf/alternate_future_" + currentTime + ".pdf"
        })
      })
      .catch((error) => {
        console.error(error);
      });
  })

  socket.on('disconnect', async function () {

    jwt.verify(socket.token, process.env.JWT_SECRET, async function (err, decoded) {
      if (!err && socket.isProcessing) {
        const userInfo = decoded
        const data = {
          isProcessing: socket.isProcessing,
          progressTimer: socket.progressTimer,
          curTime: (new Date()).getTime(),
          visionData: socket.visionData,
          userId: userInfo.id
        }
        await SAVE_VISOINDATA(data)
      }
    })

    clearInterval(socket.socketTimer)
  });
})

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`)
})