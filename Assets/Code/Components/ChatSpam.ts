import { Game } from "@Easy/Core/Shared/Game";

export default class ChatSpam extends AirshipBehaviour {
	override Start(): void {
		if (Game.IsServer()) {
			let counter = 1;
			while (task.wait(1)) {
				Game.BroadcastMessage("Hello, world! " + counter);
				counter++;
			}
		}
	}

	override OnDestroy(): void {}
}
