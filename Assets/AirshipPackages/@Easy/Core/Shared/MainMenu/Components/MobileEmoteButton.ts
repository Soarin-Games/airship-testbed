import { Bin } from "../../Util/Bin";
import { CanvasAPI } from "../../Util/CanvasAPI";

export default class MobileEmoteButton extends AirshipBehaviour {

	private bin = new Bin();

	override Start(): void {
		this.bin.AddEngineEventConnection(
			CanvasAPI.OnClickEvent(this.gameObject, () => {
				contextbridge.invoke("Emotes:OpenEmoteWheel", LuauContext.Game);
			}),
		);
	}

	override OnDisable(): void {
		this.bin.Clean();
	}
}
