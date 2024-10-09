# Auto-Moguding
Node.js编写的蘑菇钉(工学云)自动签到脚本
> QQ：1403205100
>
> 邮箱：1403205100@qq.com
>
> 微信：Yingzzi_3586
>
> **如果此项目侵犯您的合法权益，可通过邮件联系我下架此项目。**
>
> 鉴于项目的特殊性，开发者可能在任何时间**停止更新**或**删除项目**。
## 使用方法

1、要求您的电脑有node环境，具体node的安装方式请百度

2、可以验证是否安装node环境，请执行查看其版本号，如果显示版本号，则说明安装成功

```
node -v
```

3、将项目下载下来，并解压

4、在当前文件夹中执行命令，安装所需依赖（windows可以在资源管理器地址栏输入cmd回车，mac可以输入cd加空格 将文件夹拖入终端回车）

```
npm install
```

5、打开`user.json`文件，并进行个性化修改

| 字段                  | 值                                                           |
| --------------------- | ------------------------------------------------------------ |
| signIn                | 是否进行签到                                                 |
| autoUpdate            | 是否自动更新token、userId、planId                            |
| phone                 | 电话号码，用于登录                                           |
| password              | 密码，用于登录                                               |
| country               | 国家，建议填写中国，否则可能无法正常签到                     |
| province              | 省份，例如：海南省                                           |
| city                  | 城市，例如：海口市，如果是直辖市可以不填                     |
| area                  | 区/县，例如：龙华区                                          |
| desc                  | 签到备注，可留空                                             |
| type                  | 默认安卓，可以不用改                                         |
| address               | 地址，一般填写签到后显示的地址，可自由发挥整活               |
| longitude、latitude   | GPS定位经纬度，使用 https://jingweidu.bmcx.com/ 网址查询       |
| UA                    | 自定义UA，不知道可以不填                                     |
| randomLocation        | 是否开启随机位置                                             |
| token、userId、planId | 免登录所需值，不知道可以不填<br>若autoUpdate为true，脚本会自动填充以便下次登录 |

6、保存修改，执行

```
npm start
```

7、等待签到完成，查看控制台输出

## TODO:

- 可以决定一天执行几次签到周期