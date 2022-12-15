const UserModel = require("../models/userModel");
const VisualizationModel = require("../models/visualizationModel");

module.exports = {
  ADD_VISION: async data => {
    const newVision = await new VisualizationModel({
      userId: data.userInfo.id,
      link: data.fileName,
      description: data.description,
      type: data.type,
      thumbnail_url: data.thumbnail_url
    }).save();

    const findQuery = {
      userId: data.userInfo.id
    }
    let visualizationList = await VisualizationModel.find(findQuery)

    return {
      ...newVision,
      cnt: visualizationList.length
    };
  },
  SAVE_VISOINDATA: async data => {
    await UserModel.findById(data.userId).update({
      $set: {
        visionStatus: {
          isProcessing: data.isProcessing,
          progressTimer: data.progressTimer,
          visionData: data.visionData,
          curTime: data.curTime
        }
      }
    })

    return
  },
  GET_VISION_STATUS: async data => {
    const user = await UserModel.findById(data.userId)

    return {
      visionStatus: user.visionStatus
    };
  },
};