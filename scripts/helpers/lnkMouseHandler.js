import { cModuleName } from "../utils/LnKutils.js";

//takes care of additional mouse handling
class LnKMouseHandler {
	//DECLARATIONS
	//registers
	static RegisterRightClicks() {} //call all register functions
	
	static RegisterDoorRightClick() {} //register Door rightclick
	
	static RegisterTokenRightClick() {} //register Token rightclick
	
	static RegisterTokenDblClick() {} //register Token doubleClick
	
	//ons
	static onDoorRightClick(pDoorEvent, pWall) {} //called if Door is right clicked
	
	static onTokenRightClick(pTokenEvent) {} //called if Token is right clicked
	
	static async onTokenDblClick(pTokenEvent, pOldTokenCall) {} //called if Token is double clicked, returns pOldTokenCall if necessary
	
	//additional
	static canHUD(pEvent) {} //to replace the rightclick canHud which was disabled
	
	//IMPLEMENTATIONS
	//registers
	static RegisterRightClicks() {
		LnKMouseHandler.RegisterDoorRightClick();
		LnKMouseHandler.RegisterTokenRightClick();
		LnKMouseHandler.RegisterTokenDblClick();
	}
	
	static RegisterDoorRightClick() {
		//register onDoorRightClick (if possible with lib-wrapper)
		if (game.modules.get("lib-wrapper")?.active) {
			libWrapper.register(cModuleName, "DoorControl.prototype._onRightDown", function(vWrapped, ...args) {LnKMouseHandler.onDoorRightClick(...args, this.wall); return vWrapped(...args)}, "WRAPPER");
		}
		else {
			const vOldDoorCall = DoorControl.prototype._onRightDown;
			
			DoorControl.prototype._onRightDown = function (pEvent) {
				LnKMouseHandler.onDoorRightClick(pEvent, this.wall);
				
				let vDoorCallBuffer = vOldDoorCall.bind(this);
				vDoorCallBuffer(pEvent);
			}
		}		
	} 
	
	static RegisterTokenRightClick() {
		//register onTokenRightClick (if possible with lib-wrapper)
		if (game.modules.get("lib-wrapper")?.active) {
			libWrapper.register(cModuleName, "Token.prototype._canHUD", function(vWrapped, ...args) {return true}, "MIXED"); //make sure everybody can rightclick, limit hud later
			libWrapper.register(cModuleName, "Token.prototype._onClickRight", function(vWrapped, ...args) {LnKMouseHandler.onTokenRightClick(...args); if (LnKMouseHandler.canHUD(...args)) {return vWrapped(...args)} else {return}}, "MIXED");
		}
		else {
			Token.prototype._canHUD = function (user, event) {return true}; //make sure everybody can rightclick, limit hud later
			
			const vOldTokenCall = Token.prototype._onClickRight;
			
			Token.prototype._onClickRight = function (pEvent) {
				LnKMouseHandler.onTokenRightClick(pEvent);
				
				if (LnKMouseHandler.canHUD(pEvent)) {
					let vTokenCallBuffer = vOldTokenCall.bind(pEvent.currentTarget);
					vTokenCallBuffer(pEvent);
				}
			}
		}	
	}
	
	static RegisterTokenDblClick() {
		//register onTokenDoubleClick (if possible with lib-wrapper)
		if (game.modules.get("lib-wrapper")?.active) {
			libWrapper.register(cModuleName, "Token.prototype._onClickLeft2", function(vWrapped, ...args) {return LnKMouseHandler.onTokenDblClick(...args, vWrapped)}, "MIXED");
		}
		else {
			const vOldTokenCall = Token.prototype._onClickLeft2;
			
			Token.prototype._onClickLeft2 = function (pEvent) {
				let vTokenCallBuffer = LnKMouseHandler.onTokenDblClick(pEvent, pOldTokenCall);
				
				if (vTokenCallBuffer) {
					vTokenCallBuffer = vOldTokenCall.bind(pEvent.currentTarget);
					vTokenCallBuffer(pEvent);
				}
			}
		}			
	}
	
	//ons
	static onDoorRightClick(pDoorEvent, pWall) {
		Hooks.callAll(cModuleName + "." + "DoorRClick", pWall.document, {altKey : pDoorEvent.altKey, ctrlKey : pDoorEvent.ctrlKey, shiftKey : pDoorEvent.shiftKey});
	}
	
	static onTokenRightClick(pTokenEvent) {
		console.log("Check0");
		Hooks.callAll(cModuleName + "." + "TokenRClick", pTokenEvent.interactionData.object.document, {altKey : pTokenEvent.altKey, ctrlKey : pTokenEvent.ctrlKey, shiftKey : pTokenEvent.shiftKey});
	}
	
	static async onTokenDblClick(pTokenEvent, pOldTokenCall) {
		let vOldCall = await Hooks.call(cModuleName + "." + "TokendblClick", pTokenEvent.interactionData.object.document, {altKey : pTokenEvent.altKey, ctrlKey : pTokenEvent.ctrlKey, shiftKey : pTokenEvent.shiftKey}); //return false on token call to prevent sheet opening
		console.log(vOldCall);
		if(vOldCall || game.user.isGM) {
			//only if not locked/opened or isGM should the character sheet be shown
			return pOldTokenCall(pTokenEvent);
		}
		else {
			return;
		}
	}
	
	//additional
	static canHUD(pEvent) { //adapted from core
		if ( canvas.controls.ruler.active ) return false;
		return game.user.isGM || (pEvent.interactionData.object.document.actor?.testUserPermission(game.user, "OWNER") ?? false);
	}
	
}

//Hooks
Hooks.on("init", function() {
	LnKMouseHandler.RegisterRightClicks();
});