namespace __Navimi_Hot {

    let wsHotClient: WebSocket;

    export const openHotWs = (hotOption: number | boolean, digestHot: (json: hotPayload) => void): void => {
        try {
            if (!('WebSocket' in window)) { 
                console.error("Websocket is not supported by your browser!");
                return;
            }

            console.warn("Connecting HOT...");
            const port = hotOption === true ? 8080 : hotOption;
            wsHotClient = null;
            wsHotClient = new WebSocket(`ws://localhost:${port}`);
            wsHotClient.addEventListener('message', (e: any) => {
                try {
                    const json: hotPayload = JSON.parse(e.data || "");
                    if (json.message) {
                        console.warn(json.message);
                        return;
                    }
                    if (json.filePath) {
                        digestHot(json);
                    }
                } catch (ex) {
                    console.error("Could not parse HOT message:", ex);
                }
            });
            wsHotClient.onclose = () => {
                console.warn('HOT Connection Closed!');
                setTimeout(openHotWs, 5000, hotOption);
            };
        } catch (ex) {
            console.error(ex);
        }
    };
    
}