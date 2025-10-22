import { CoreContext } from "@Easy/Core/Shared/CoreClientContext";
import { Game } from "@Easy/Core/Shared/Game";
import GearUnlockUI from "./GearUnlockUI";

export default class GearUnlockManager extends AirshipBehaviour {
	public container: GameObject;
	public ui: GearUnlockUI;

	override Start(): void {
		this.container.SetActive(false);

		if (Game.coreContext !== CoreContext.MAIN_MENU) {
			return;
		}

		this.ShowRewardYielding("8710579e-6ab5-4122-a7eb-4cffe842e114");
	}

	public ShowRewardYielding(gearClassId: string): void {
		if (!Game.playerFlags.has("PlatformGearDownloadClassId")) {
			warn("Missing flags for platform gear download.");
			return;
		}

		print("Downloading reward gear...");
		const gear = PlatformGear.DownloadYielding(gearClassId);
		if (!gear) {
			warn("Downloaded gear unlock was undefined");
			return;
		}

		print("Downloaded! Showing now...");
		this.container.SetActive(true);
		this.ui.SetGear(gear);
	}

	override OnDestroy(): void {}
}
