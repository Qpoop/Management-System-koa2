const router = require("koa-router")();

const User = require("./../models/userSchema");
const Counter = require("./../models/counterSchema");
const utils = require("./../utils/util");
const jwt = require("jsonwebtoken");
const md5 = require("md5");

router.prefix("/users");

router.post("/login", async (ctx) => {
  try {
    const { userName, userPwd } = ctx.request.body;
    console.log(userName, userPwd);
    const res = await User.findOne(
      {
        userName,
        userPwd,
      },
      "userId userName userEmail state role deptId roleList"
    );
    const data = res._doc;
    const token = jwt.sign(
      {
        data,
      },
      "huang",
      { expiresIn: "1h" }
    );
    if (res) {
      ctx.body = utils.success({ ...data, token });
    } else {
      ctx.body = utils.fail("账号或密码不正确");
    }
  } catch (error) {
    ctx.body = utils.fail(error.msg);
  }
});

// 用户列表
router.get("/list", async (ctx) => {
  const { userId, userName, state } = ctx.request.query;
  const { page, skipIndex } = utils.pager(ctx.request.query);

  let params = {};
  if (userId) params.userId = userId;
  if (userName) params.userName = userName;
  if (state && state * 1 !== 0) params.state = state;

  try {
    const query = User.find(params, { _id: 0, userPwd: 0 });
    const list = await query.skip(skipIndex).limit(page.pageSize);

    const total = await User.countDocuments(params);

    ctx.body = utils.success({
      page: {
        ...page,
        total,
      },
      list,
    });
  } catch (error) {
    ctx.body = utils.fail(`查询异常:${error.stack}`);
  }
});

// 用户删除和批量删除
router.post("/delete", async (ctx) => {
  // 待删除的用户id数组
  const { userIds } = ctx.request.body;
  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 });
  console.log("res----", res);
  if (res.modifiedCount) {
    ctx.body = utils.success(res, `共删除了${res.modifiedCount}条数据`);
    return;
  } else if (res.matchedCount) {
    ctx.body = utils.fail("用户不存在");
    return;
  }
  ctx.body = utils.fail("删除失败");
});

// 用户新增/编辑
router.post("/operate", async (ctx) => {
  const {
    userId,
    userName,
    userEmail,
    mobile,
    job,
    state,
    roleList,
    deptId,
    action,
  } = ctx.request.body;
  if (action === "add") {
    if (!userName || !userEmail || !deptId) {
      ctx.body = utils.fail("参数错误", utils.PARAM_ERROR);
      return;
    }
    const res = await User.findOne(
      { $or: [{ userName }, { userEmail }] },
      "_id userName userEmail"
    );
    if (res) {
      ctx.body = utils.fail(
        `系统中存在重复信息,${res.userName}-${res.userEmail}`
      );
    } else {
      const doc = await Counter.findOneAndUpdate(
        { _id: "userId" },
        { $inc: { sequence_value: 1 } },
        { new: true }
      );
      try {
        const user = new User({
          userId: doc.sequence_value,
          userName,
          userPwd: md5("123456"),
          userEmail,
          role: 1,
          roleList,
          job,
          state,
          deptId,
          mobile,
        });
        user.save();
        ctx.body = utils.success({}, "用户创建成功");
      } catch (error) {
        ctx.body = utils.fail(error.stack, "创建用户失败");
      }
    }
  } else {
    if (!deptId) {
      ctx.body = utils.fail("部门不能为空", utils.PARAM_ERROR);
      return;
    }
    try {
      const res = await User.findOneAndUpdate(
        { userId },
        { mobile, job, state, roleList, deptId }
      );
      ctx.body = utils.success({}, "更新成功");
    } catch (error) {
      ctx.body = utils.fail(error.stack, "更新失败");
    }
  }
});
module.exports = router;
