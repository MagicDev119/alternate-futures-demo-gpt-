const visualizationModel = require('../models/visualizationModel')
const utils = require('../utils/utils')

const index = async function (req, res, next) {
  try {
    const findQuery = {
      userId: req.user._id
    }
    const sharedQuery = {
    }
    const defaultQuery = {
      category: "default"
    }
    let visualizationList = !req.query.filterType ? [] : ((req.query.filterType === 'like') ? await visualizationModel.find({}).sort({ createdAt: 'desc' }).populate('userId') : await visualizationModel.find(findQuery).sort({ createdAt: 'desc' }).populate('userId'))
    let sharedVisualizationList = req.query.filterType ? [] : await visualizationModel.find(sharedQuery).sort({ createdAt: 'desc' }).populate('userId')
    visualizationList = [...visualizationList, ...sharedVisualizationList]
    visualizationList = visualizationList.filter(each => {
      if (!each.userId) return false
      const gender = req.query.gender ? (each.userId.gender === req.query.gender) : true
      const race = req.query.race ? (each.userId.race === req.query.race) : true
      const age = req.query.age ? (utils._calculateAge(each.userId.birthday) == req.query.age) : true
      const search = req.query.q ? (each.description && each.description.join(',').toLowerCase().includes(req.query.q.toLowerCase())) : true
      const filterType = req.query.filterType ? ((req.query.filterType === 'like') ? (each.like.includes(req.user.email)) : (each.type === req.query.filterType)) : true
      return gender && race && age && search && filterType
    })
    let defaultList = [] //(req.query.q || (req.query.filterType && req.query.filterType !== 'like')) ? [] : await visualizationModel.find(defaultQuery)
    defaultList = defaultList.filter(each => {
      const filterType = req.query.filterType ? ((req.query.filterType === 'like') ? (each.like.includes(req.user.email)) : (each.type === req.query.filterType)) : true
      return filterType
    })
    return res.send({
      code: 200,
      message: "List get sucessfully",
      data: [...visualizationList, ...defaultList],
    })
  } catch (error) {
    console.log(error)
    return res
      .status(404)
      .send({ code: 404, messsage: "not able to get list", error: error })
  }
}

const show = async function (req, res, next) {
  try {
    let visualizationData = await visualizationModel.find({
      _id: req.params.id,
    }).populate('userId');
    const findQuery = {
      userId: visualizationData[0].userId._id
    }
    let visualizationList = await visualizationModel.find(findQuery)
    return res.send({
      code: 200,
      message: "Visualization get sucessfully",
      data: visualizationData,
      cnt: utils._calculateAge(visualizationData[0].userId.birthday)
    });
  } catch (error) {
    return res
      .status(404)
      .send({ code: 404, messsage: "not able to get Visualization", error: error });
  }
}

const store = async function (req, res, next) {
  try {
    req.body.userId = req.user.id
    const newVisualization = await visualizationModel(req.body).save();
    let visualizationData = await visualizationModel.find({
      userId: req.user.id
    });
    return res.status(200).send({
      code: 200,
      message: "Visualization created sucessfully",
      data: visualizationData,
      newVisualization: newVisualization,
    });
  } catch (error) {
    return res.status(404).send({
      code: 404,
      messsage: "not able to create visualization",
      error: error,
    });
  }
}

const update = async function (req, res, next) {
  try {
    let { id, visualization } = req.body;

    const visualizationData = await visualizationModel.findOneAndUpdate(
      { _id: id },
      { $set: visualization }
    );
    return res.send({
      code: 200,
      message: "Visualization updated sucessfully",
      data: visualizationData,
    });
  } catch (error) {
    return res.status(404).send({
      code: 404,
      messsage: "not able to update Visualization",
      error: error,
    });
  }
}

const destroy = async function (req, res, next) {
  try {
    let visualizationData = await visualizationModel.deleteMany({
      _id: {
        $ne: req.params.id
      }
    }) //visualizationModel.findOneAndDelete({ _id: req.params.id });
    return res.send({
      code: 200,
      message: "Visualization deleted sucessfully",
      data: visualizationData,
    });
  } catch (error) {
    return res
      .status(404)
      .send({ code: 404, messsage: "not able to get Visualization", error: error });
  }
}

module.exports = {
  index: index,
  show: show,
  store: store,
  update: update,
  destroy: destroy
}