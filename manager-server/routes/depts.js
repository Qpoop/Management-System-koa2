const router = require("koa-router")();
const util = require("./../utils/util");
const Dept = require("../models/deptSchema");

router.prefix("/dept");

router.get("/list", async (ctx) => {
  const { deptName } = ctx.request.query;
  const params = {};
  if (deptName) params.deptName = deptName;
  try {
    let rootList = (await Dept.find(params)) || [];
    if (deptName) {
      ctx.body = util.success(rootList);
    } else {
      let treeList = getTreeDept(rootList, null, []);
      ctx.body = util.success(treeList);
    }
  } catch (error) {
    ctx.body = util.fail(`查询失败:${error.stack}`);
  }
});

// 递归拼接树形列表
function getTreeDept(rootList, id, list) {
  for (let i = 0; i < rootList.length; i++) {
    let item = rootList[i];
    if (String(item.parentId.slice().pop()) === String(id)) {
      list.push(item._doc);
    }
  }
  list.map((item) => {
    item.children = [];
    getTreeDept(rootList, item._id, item.children);
    if (item.children.length === 0) {
      delete item.children;
    }
  });
  return list;
}

router.post("/operate", async (ctx) => {
  const { _id, action, ...params } = ctx.request.body;
  let info;
  try {
    if (action === "create") {
      await Dept.create(params);
      info = "创建成功";
    } else if (action === "edit") {
      params.updateTime = new Date();
      await Dept.findByIdAndUpdate(_id, params);
      info = "编辑成功";
    } else if (action === "delete") {
      await Dept.findByIdAndRemove(_id);
      await Dept.deleteMany({ parentId: { $all: [_id] } });
      info = "删除成功";
    }
    ctx.body = util.success({}, info);
  } catch (error) {
    ctx.body = util.fail(error.stack, "部门新加 / 编辑失败");
  }
});

module.exports = router;
