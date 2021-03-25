const WebSocket = require('ws');

//LOGGER
let logger = require('log4js').getLogger();
logger.level = "trace";

const RegisterCanvas = {
    OP_CODE : 0xA0,
    dehydrate(canvasId){
        let buffer = new ArrayBuffer(2),
            view   = new DataView(buffer);
        view.setInt8(0, 0xA0);
        view.setInt8(1, canvasId);
        return buffer;
    }
};

module.exports = class ProtocolClient{
    constructor() {
        logger.trace('[WS] creating ProtocolClient');
        this.isConnecting = this.isConnected = false;
        this.ws = this.name = null;
        this.canvasId = 0;
    }

    async connect() {
        this.isConnecting = true;
        if (this.ws) logger.trace('[WS] WebSocket already open, not starting');
        this.timeConnected = Date.now();
        this.ws = new WebSocket('wss://pixelplanet.fun/ws');
        this.ws.binaryType = 'arraybuffer';
        this.ws.onopen = () => {
            this.isConnecting = false;
            this.isConnected  = true;
            logger.info('[WS] open');
            if(this.canvasId !== null) this.ws.send(RegisterCanvas.dehydrate(this.canvasId));
        };
        this.ws.onmessage = ({data:message}) => {
            try {
                if (typeof message === 'string') this.onTextMessage(message);
            } catch (err) {
                logger.error(`[WS] An error occured while parsing websocket message`);
                logger.error(err);
            };
        };
        this.ws.onclose = e => {
            logger.info('[WS] close');
            this.ws = null;
            this.isConnected = false;
            const timeout = this.timeConnected < Date.now() - 7000 ? 1000 : 5000;
            logger.warn(`[WS] Socket is closed. Reconnect will be attempted in ${timeout} ms.`,e.reason);
            setTimeout(this.connect.bind(this), 5000);
        };
        this.ws.onerror = e => {
            logger.error('[WS] Socket encountered error, closing socket', e);
            this.ws.close();
        };
    }

    onTextMessage(){
        
    }
};