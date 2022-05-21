/**
 * 维护用户id自增表
 */
const mongoose = require("mongoose");
const roleSchema = mongoose.Schema({
  roleName: String,
  remark: String,
  permissionList: {
    checkedKeys: [],
    halfCheckedKeys: [],
  },
  createTime: {
    type: Date,
    default: Date.now(),
  }, //创建时间
  updateTime: {
    type: Date,
    default: Date.now(),
  }, //更新时间
});

module.exports = mongoose.model("role", roleSchema, "roles");
