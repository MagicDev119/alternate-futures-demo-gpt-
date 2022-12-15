const mongoose = require('mongoose')

const url = process.env.LOCAL_DB_URI + process.env.DB_NAME
console.log("url=> ", url)
mongoose.connect(url, {
    useNewUrlParser: true,
    autoIndex: true,
    maxPoolSize: 20,
    useUnifiedTopology: true
}).then(() => {
    console.log('Database connected.')
}).catch((error) => {
    console.log(error)
    console.log('Database not connected.')
})