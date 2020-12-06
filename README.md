# JUSTCTF平台运维笔记&服务修复

> 前提说明
>
> 本服务基于ctfd和赵师傅的ctf_whale



### 使用ctf_whale过程中遇到的问题

1. python版本冲突

2. 并发协程，gevent库依赖的版本冲突

3. 国内清华镜像安装源更改造成的下载失败

4. **致命问题**

   ctf_whale动态容器无法正常使用,docker创建的服务无端口号，访问无响应



### 针对问题所做的修复

1. 前三个问题分别进行了换源修复
2. 致命问题

自己重新写了一个后端服务，专门用来处理动态容器，采用暴露集群公网ip的方法来亡羊补牢



### 服务使用手册

> 如果你的服务也遇到了类似的问题导致frp内网服务启动失败或故障可以尝试使用本仓库

```bash
# 安装好ctf-whale后无法正常启动docker
# 下载
git clone https://github.com/fengx1a0/ctfd_docker.git
cd ctfd_docker

# 将view.js替换掉ctfd_whale里的view.js
cd
rm -f ~/CTFd/CTFd/plugins/ctfd-whale/assets/view.js
cp ctf_whale_enhanced/view.js ~/CTFd/CTFd/plugins/ctfd-whale/assets/ # 或者自行替换，这里只做参考

# 安装好node v12.17.0 ， 文件里付了node的安装包
cd node
# 服务的运行环境必须为有root权限的集群管理节点manager上
cnpm install -i

# 启动服务
node app.js # 默认端口23333 ， 如需更改，请自行配置view.js 和 app.js
```



**文件配置(重要！)**

```bash
vim data.json
# 此文件以json储存题目数据，也就是，前面对应题目号，后面对应题目的镜像(前提你的集群已经全部有了该镜像)

# 每次跟新配置文件需要重启服务，CTRL+C , node app.js

# ctf_whale题目填写页面的镜像名填helloworld，其他随便
```



**已知Bug**

```bash
由于限制单ip开容器，所以开启下一个容器(在对象未被销毁前必须手动销毁上一个容器)
```



**功能概述**

1. 首先实现了安全策略，10秒内请求量达到15次会封禁ip并写入hack.log
2. 其次实现了docker容器的动态启动和销毁(仿造了原先的功能)
3. 最后是异步调用，优化性能
4. 日志文件有详细日志和简短日志，运行后自动产生





