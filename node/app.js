const koa = require('koa2');
const router = require('koa-router')();
const bodyParser = require('koa-bodyparser');;
const md5 = require("md5");
const fs = require("fs");
const serverlist = {
    "wing": "101.36.122.23",
    "node7": "106.75.214.10",
    "node6": "121.41.230.234",
    "node3": "139.224.16.249",
    "node2": "120.79.25.56",
    "node5": "47.101.152.134"
};
const tasklist = {};
const taskinfo = {};
const blacklist = [];
var whitelist={};
var client_port_t = '';
var client_ip_t = '';
var text = fs.readFileSync("data.json");
var list = JSON.parse(text);
console.log(list);

var app = new koa();
app.use(bodyParser());

app.use(async (ctx, next) => {
    fs.appendFileSync("./log_detail.logs",JSON.stringify(ctx.request)+"\n\n\n\n\n\n");
    fs.appendFileSync("./log_smart.logs",
    	"time: " + new Date() + "\n" +
        "ip: " + ctx.request.ip + "\n" + 
        "GET: " + ctx.request.originalUrl + "\n" +
        "POST: " + JSON.stringify(ctx.request.body) + "\n" +
        "Header: " + JSON.stringify(ctx.request.headers) + "\n\n\n\n\n\n\n"
    )

    if(!whitelist[ctx.request.ip])
    {
        whitelist[ctx.request.ip] = 1;
    }
    whitelist[ctx.request.ip]++;
    setInterval(()=>{
        for(var ip of Object.keys(whitelist))
        {
            if(whitelist[ip] >= 10)
            {
                blacklist.push(ip);
            }
        }
        whitelist = {};
    },10000);
    
    console.log(new Date());
    ctx.set("Access-Control-Allow-Origin", "*");
    ctx.set("Access-control-Allow-Headers", "xCors");
    
    let pos = 1 ;
    for(var ip of blacklist)
    {
        if(ip == ctx.request.ip)
        {
            pos = 0 ; 
        }
    }
    if (pos) await next();
    
    if (ctx.status == 404) {
        ctx.status = 502;
        ctx.body = '<h1><center>There is an error orrcurred on this server </center></h1>';
    } else {
        console.log(ctx.url);
    }
})

router.post('/data', (ctx) => {
    let ip = ctx.request.ip;
    let data = ctx.request.body;
    let contain_name = md5(ip).substring(0, 8);
    try{
        console.log(data.task_name);
    	var contian_task = list[data.task_name];
        console.log(contian_task);
    }
    catch(e){
    	console.log(e);
    	console.log("hacker !");
    	fs.appendFileSync("./hacker_blacklist.logs",
    		"time: " + new Date() + "\n" +
	        "ip: " + ctx.request.ip + "\n" + 
	        "GET: " + ctx.request.originalUrl + "\n" +
	        "POST: " + JSON.stringify(ctx.request.body) + "\n" +
	        "Header: " + JSON.stringify(ctx.request.headers) + "\n\n\n\n\n\n\n")
    	blacklist.push(ip);
    	ctx.body = {
    		code: 404
    	}
    	return;
    }
    let contian_opt = data.option;
    if (contian_opt == "boot") {
        let obj = {
            code: 200,
            data: {
                status: "ok"
            }
        }
        ctx.body = obj;

        let exec = require("child_process").exec;
        if (taskinfo[contain_name] != undefined) {
            taskinfo[contain_name] = undefined;
        }
        function create_docker() {
            return new Promise((reslove, reject) => {
                console.log(contian_task);
                exec("docker service create --replicas 1 --name " + contain_name + " -p 80 " + contian_task, (err, stout, stderr) => {
                    if (err) {
                        reslove(err);
                        return;
                    } else if (stderr) {
                        reslove(stderr);
                        return;
                    } else {
                        reslove(stout);
                    }
                })
            })
        }

        function get_port() {
            return new Promise((reslove, reject) => {
                exec("docker service inspect " + contain_name, (err, stdout, stderr) => {
                    let tar = stdout;
                    if (err) {
                        reslove(err);
                        return;
                    } else if (stderr) {
                        reslove(stderr);
                        return;
                    } else {
                        client_port_t = tar.match(/"PublishedPort": \d+/g)[0].replace('"PublishedPort": ', '');
                        reslove(stdout);
                    }
                })
            })
        }

        function get_ip() {
            return new Promise((reslove, reject) => {
                exec("docker service ps " + contain_name, (err, stdout, stderr) => {
                    let tar = stdout;
                    if (err) {
                        reslove(err);
                        return;
                    } else if (stderr) {
                        reslove(stderr);
                        return;
                    } else {
                        let client_addr = tar.match(/node\d+/g);
                        if(client_addr)
                        	client_ip_t = serverlist[client_addr[0]];
                        else
                        	client_ip_t = serverlist['wing'];
                        reslove(stdout);
                    }
                })
            })
        }

        
        create_docker()
                .then((data)=>{
                    console.log(data);
                    return get_port();
                })
                .then((data)=>{
                    console.log(data);
                    return get_ip();
                })
                .then((data)=>{
                    console.log(data);
                    console.log(client_ip_t);
                    console.log(client_port_t);
                    taskinfo[contain_name] = {
                        client_ip: client_ip_t,
                        client_port: client_port_t
                    }
                })
                .catch((e)=>{
                    console.log(e);
                })
        
        tasklist[contain_name] = setTimeout(() => {
            exec("docker service rm " + contain_name, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    return;
                } else if (stderr) {
                    console.log(stderr);
                    return;
                } else {
                    console.log(stdout);
                }
            })
        }, 3600000);
    }

    else if(contian_opt == "get_info")
    {
        try{
        	if (taskinfo[contain_name] == undefined) {
        		let obj = {
                code: 200,
                data: {
                    ip: 'Please Wait... ',
                    port: 'A few minutes'
                    }
                }
                ctx.body = obj;
        		return;
        	}
        	let ip_tmp = taskinfo[contain_name].client_ip;
        	let port_tmp = taskinfo[contain_name].client_port;
            ctx.set("Access-Control-Allow-Origin", "*");
            ctx.set("Access-control-Allow-Headers", "xCors");
            let obj = {
                code: 200,
                data: {
                    ip: ip_tmp,
                    port: port_tmp
                }
            }
            ctx.body = obj;
        }catch(e){
        	console.log(e);
        	return;
        }
    }

    else if (contian_opt == "destroy") {
    	try{
	    	let exec2 = require("child_process").exec;
	        exec2("docker service rm " + contain_name, (err, stdout, stderr) => {
	            if (err) {
	                console.log(err);
	                return;
	            } else if (stderr) {
	                console.log(stderr);
	                return;
	            } else {
	                console.log(stdout);
	            }
	        })
	    	ctx.body = {
	    		code: 200
	    	};
    	}catch(e){
    		console.log(e);
    		console.log("hacker !");
	    	fs.appendFileSync("./hacker_blacklist.logs",
	    		"------destroy_collsion------\ntime: " + new Date() + "\n" +
		        "ip: " + ctx.request.ip + "\n" + 
		        "GET: " + ctx.request.originalUrl + "\n" +
		        "POST: " + JSON.stringify(ctx.request.body) + "\n" +
		        "Header: " + JSON.stringify(ctx.request.headers) + "\n\n\n\n\n\n\n");
	    	// blacklist.push(ip);
	    	ctx.body = {
	    		code: 404
	    	}
    		return;
    	}

    }

    else if (contian_opt == "renew") {
    	try{
	    	clearTimeout(tasklist[contain_name]);
	        tasklist[contain_name] = setTimeout(() => {
            let exec = require("child_process").exec;
            exec("docker service rm " + contain_name, (err, stdout, stderr) => {
                    if (err) {
                        console.log(err);
                        return;
                    } else if (stderr) {
                        console.log(stderr);
                        return;
                    } else {
                        console.log(stdout);
                    }
                })
	        }, 3600000);
	    	ctx.body = {
	    		code: 200
	    	};
    	}catch(e){
    		console.log(e);
    		console.log("hacker !");
	    	fs.appendFileSync("./hacker_blacklist.logs",
	    		"-------renew------\ntime: " + new Date() + "\n" +
		        "ip: " + ctx.request.ip + "\n" + 
		        "GET: " + ctx.request.originalUrl + "\n" +
		        "POST: " + JSON.stringify(ctx.request.body) + "\n" +
		        "Header: " + JSON.stringify(ctx.request.headers) + "\n\n\n\n\n\n\n");
	    	blacklist.push(ip);
	    	ctx.body = {
	    		code: 404
	    	}
    		return;
    	}
    }

    else{
    	console.log("hacker !");
    	fs.appendFileSync("./hacker_blacklist.logs",
    		"------fake_opt------\ntime: " + new Date() + "\n" +
	        "ip: " + ctx.request.ip + "\n" + 
	        "GET: " + ctx.request.originalUrl + "\n" +
	        "POST: " + JSON.stringify(ctx.request.body) + "\n" +
	        "Header: " + JSON.stringify(ctx.request.headers) + "\n\n\n\n\n\n\n");
    	blacklist.push(ip);
    }
});


app.use(router.routes());
app.listen(23333);
