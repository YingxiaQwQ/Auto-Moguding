const cryptoJS = require('crypto-js');
const fs = require('fs')
const path = require('path')
const axios = require('axios')

let user, userId, token, sign, agent, planId
const key = '23DbtQHR2UMbH6mJ'; // 蘑菇钉的秘钥

// 设置全局默认请求头
axios.defaults.headers.common['Content-Type'] = "application/json; charset=UTF-8";
// 全局UA
axios.defaults.headers.common['User-Agent'] = agent
// 全局URL
axios.defaults.baseURL = 'https://api.moguding.net:9000'

// 读取user.json，检查必要字段，有问题直接终止程序
try {
  user = JSON.parse(fs.readFileSync(path.resolve(__dirname, './user.json'), 'utf8'))[0]
  if (!(user.phone && user.password && user.country && user.province && user.longitude && user.latitude && user.address)) {
    throw new Error('user.json中缺少必要参数,请检查user.json\n')
  }
} catch (e) {
  console.log('读取user.json失败', e)
  process.exit(1)
}

// user是否指定UA
if (!user.UA) {
  const uaList = JSON.parse(fs.readFileSync(path.resolve(__dirname, './uaList.json'), 'utf8'))
  agent = uaList[Math.floor(Math.random() * uaList.length)]
  console.log(`随机UA: ${agent}\n`)
} else {
  agent = user.UA
  console.log(`指定UA: ${agent}\n`)
}

// 是否启用偏移定位
if (user.randomLocation) {
  user.longitude = user.longitude.slice(0, -3) + (Math.floor(Math.random() * 1000))
  user.latitude = user.latitude.slice(0, -3) + (Math.floor(Math.random() * 1000))
  console.log(`已使用坐标偏移,新坐标${user.longitude},${user.latitude}\n`)
}

// 是否指定了token、userId、planId,否则就需要登录
if (user.token && user.userId && user.planId) {
  console.log('已读取到token、userId、planId,开始检测token是否有效,今日是否签到 \n')
  token = user.token
  userId = user.userId
  planId = user.planId
  // 检查签到记录和token是否过期
  signCheck()
} else {
  // 登录
  run()
}

// 执行登录逻辑、赋值全局、更新user.json、检查签到记录和token是否过期
function run() {
  getToken(user).then((res) => {
    token = res.token
    userId = res.userId
    // 获取到sign签名
    sign = getSign(userId + 'student')
    // 获取计划id
    return getPlanId(token, sign)
  })
    .then(res => {
      planId = res
      if (user.autoUpdate) {
        console.log('获取token与userId与planId成功,已将最新的数据写入了user.json,若不想自动更新,请将user.json中的autoUpdate设置为false \n')
        user.planId = planId
        user.token = token
        user.userId = userId
        fs.writeFileSync(path.resolve(__dirname, './user.json'), JSON.stringify([user], null, 2))
      } else {
        console.log('获取token与userId与planId成功,但user.json中关闭了自动更新\n')
      }
      signCheck()
    })
}

// 登录逻辑
async function getToken(user) {
  postData = {
    phone: encryptAES(user.phone, key),
    password: encryptAES(user.password, key),
    t: encryptAES(String(Date.now()), key),
    loginType: user.type,
  }
  const result = await axios.post('/session/user/v3/login', JSON.stringify(postData))
  if (result.data.code !== 200) {
    throw new Error(result.data.msg)
  } else {
    return result.data.data
  }
}

// 获取计划id
async function getPlanId(token, sign) {
  data = { "state": "" }
  let result = await axios.post('/practice/plan/v3/getPlanByStu', JSON.stringify(data), {
    headers: {
      'roleKey': 'student',
      "authorization": token,
      "sign": sign,
      "content-type": "application/json; charset=UTF-8",
      "user-agent": agent
    }
  })
  if (result.data.code !== 200) {
    throw new Error(result.data.msg)
  } else {
    return result.data.data[0].planId
  }
}

// 查询签到记录
async function signCheck() {
  const headers = {
    "accept-encoding": "gzip",
    "content-type": "application/json;charset=UTF-8",
    "rolekey": "student",
    "host": "api.moguding.net:9000",
    "authorization": token,
    "user-agent": agent
  }
  let result = await axios.post('/attendence/clock/v1/listSynchro', JSON.stringify({
    t: encryptAES(String(Date.now()), key)
  }), { headers })

  if (result.data.code === 401) {
    console.log('token已失效,将执行登录逻辑\n')
    run()
    return
  } else if (result.data.code === 200) {
    // 最近的一次签到时间、类型
    lastSign = result.data.data[0]
    lastSignTime = new Date(lastSign.attendenceTimeLong).toLocaleDateString('zh-CN')
    currentTime = new Date().toLocaleDateString('zh-CN')
    lastSignType = lastSign.type
    // 判断是否需要签到
    if (lastSignTime === currentTime && lastSignType === 'END') {
      console.log(`!!! 今日已签到,签到类型为${lastSignType},今天已经不需要签到了 !!!\n`)
      return
    } else if (lastSignTime === currentTime && lastSignType === 'START') {
      console.log(`!!! 今日已签到,签到类型为${lastSignType},所以签下班到 !!!\n`)
      save(user, userId, token, planId, 'END')
    } else {
      console.log(`!!! 今日未签到,即将开始签上班到 !!!\n`)
      save(user, userId, token, planId, 'START')
    }
  } else {
    console.log(result.data)
    return
  }
}

// 签到逻辑
function save(user, userId, token, planId, type) {
  if (!user.signIn) {
    console.log('!!! user.json内已关闭签到功能 !!!')
    return
  }
  const text = user.type + type + planId + userId + user.address
  const headers = {
    'roleKey': 'student',
    "authorization": token,
    "sign": getSign(text),
    "content-type": "application/json; charset=UTF-8",
    "user-agent": agent
  }
  data = {
    "country": user.country,
    "address": user.address,
    "province": user.province,
    "city": user.city,
    "area": user.area,
    "latitude": user.latitude,
    "description": user.desc,
    "planId": planId,
    "type": type,
    "device": user.type,
    "longitude": user.longitude
  }
  axios.post('/attendence/clock/v2/save', data, { headers })
    .then(res => {
      if (res.data.code === 200) {
        console.log(`签到成功啦,厉不厉害你樱夏！完成时间:${res.data.data.createTime}`)
      } else {
        console.log(res.data)
      }
    })
}

// 使用CryptoJS进行AES加密
function encryptAES(str, key) {
  // 使用CryptoJS AES加密
  let ciphertext = cryptoJS.AES.encrypt(str, cryptoJS.enc.Utf8.parse(key), {
    mode: cryptoJS.mode.ECB, // ECB模式
    padding: cryptoJS.pad.Pkcs7 // PKCS#7填充
  });
  // 将CipherParams对象转换为十六进制字符串
  return ciphertext.ciphertext.toString().toString(cryptoJS.enc.Hex);
}

// 签到md5实现
function getSign(text) {
  str = text + "3478cbbc33f84bd00d75d7dfa69e0daa"
  return cryptoJS.MD5(str).toString(cryptoJS.enc.Hex)
}


