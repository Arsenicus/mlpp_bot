const Discord = require('discord.js');
const client = new Discord.Client();
let logger = require('log4js').getLogger();
logger.level = "trace";

let AllChanelsId = ['824632702954635317']

//PIXELPLANET EVENT

const ProtocolClient =  require('./ProtocolClient');
//I18N
const i18n = require('./i18n.json')
/*
const i18n = new (require('./I18n'))();
i18n.load('./resources/i18n.json');
i18n.choose('ru');*/
const PPEvent = new function(){
	this.lastEventPlaceHash = null;
	this.timeFromLastTimeSet = null;
	this.timeToNext = null;

	this.sendToSubscribers = function(parsed){
	
		AllChanelsId.forEach(id => client.channels.cache.get(id).send(parsed.text));
	};
	this.setTimeToNext = function(time){
		this.timeFromLastTimeSet = Date.now();
		return this.timeToNext = time;
	};
	this.getTimeToNext = function(){
		return this.timeToNext ? this.timeToNext + this.timeFromLastTimeSet - Date.now() : null;
	};
};

const ws = new ProtocolClient();
ws.connect();
ws.onTextMessage = function(msg){
	try{
		msg = JSON.parse(msg);
		
		if(msg[0] === 'event' && msg[2] === 'xx'){
			let parsed = parsePPEvent(msg[1]);
			if(parsed.text) {
				PPEvent.sendToSubscribers(parsed);
				logger.info(`[PP] ${parsed.text}`)
			};
		};
	}catch(e){
		logger.error(e);
	};
};

function parsePPEvent(msg){
	//ФУНКЦИЯ НЕ ТОЛЬКО ПАРСИТ СООБЩЕНИЯ
	let returnMsg,phase;
	 if(msg.includes('Suspicious activity')){
		PPEvent.setTimeToNext(3600*1e3);
		returnMsg = i18n.ru.PPEvent.beforeHour;
		phase = 'beforeHour';
	} else if(msg.includes('Unstable area')){
		/*
		returnMsg = i18n.PPEvent.beforeHalfHour;
		phase = 'beforeHalfHour';
		*/
		PPEvent.setTimeToNext(0.5*3600*1e3);
		returnMsg = null;
	} else if(msg.includes('Alert! Threat is rising')){
		PPEvent.lastEventPlaceHash = msg.replace('Alert! Threat is rising in 2min near ','')
		PPEvent.setTimeToNext(2*60*1e3);
		returnMsg = null;
	} else if(msg === 'Alert! Danger!'){
		returnMsg = null;
	} else if(msg === 'Fight starting!'){
		returnMsg = `${i18n.ru.PPEvent.start} \n https://fuckyouarkeros.fun/${PPEvent.lastEventPlaceHash}`;
		phase = 'start';
	} else if(msg.includes('Clown Void reached')){
		returnMsg = null;
	} else if(msg === 'Threat successfully defeated. Good work!'){
		PPEvent.setTimeToNext(2*3600*1e3);
		returnMsg = i18n.ru.PPEvent.win;
		phase = 'win';
	} else if(msg === 'Threat couldn\'t be contained, abandon area'){
		PPEvent.setTimeToNext(2*3600*1e3);
		returnMsg = i18n.ru.PPEvent.defeat
		phase = 'defeat';
	} else if(msg.includes('Celebration time over')){
		PPEvent.setTimeToNext(1.5*3600*1e3);
		returnMsg = i18n.ru.PPEvent.boostEnd;
		phase = 'boostEnd';
	} else if(msg === 'Void seems to leave again.'){
		PPEvent.setTimeToNext((2*3600 - 5*60)*1e3);
		returnMsg = i18n.ru.PPEvent.boostEnd;
		phase = 'boostEnd';
	} else{
		returnMsg = `[PPEvent] undefined status\n ${msg}`;
	};
	return {
		text: returnMsg,
	};
};


client.login('Nzc0NzA0NjgxMzY0NDg4MjIy.X6bp9Q.XDvYAQz4CfJlEmpMt_DcBOJGpkg');