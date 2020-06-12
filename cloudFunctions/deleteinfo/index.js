// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init();
const db = cloud.database();
const infoform = db.collection("infos");
const scheduleform = db.collection("schedules");

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const {infoid} = event
  try{
    let info = await infoform.doc(infoid).get()
    scheid = info.data.scheid
    let scheresult = await scheduleform.doc(scheid).get()
    await scheduleform.doc(scheresult.data._id)
      .update({
        data:{
          attenders: [...scheresult.data.attenders.filter(x=>x!=info.data.userid)]
        }
      })
    let result = await infoform.doc(infoid).remove()
    return {
      code: 200,
      result
    }
  }
  catch(e){
    return {
      code: 500,
      error: e
    }
  }

}