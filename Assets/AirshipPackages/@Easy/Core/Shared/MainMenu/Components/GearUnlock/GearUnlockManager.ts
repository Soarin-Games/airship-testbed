import { Game } from "@Easy/Core/Shared/Game";
import GearUnlockUI from "./GearUnlockUI";

export default class GearUnlockManager extends AirshipBehaviour {
	public container: GameObject;
	public ui: GearUnlockUI;

	override Start(): void {
		this.container.SetActive(false);

		this.ShowRewardYielding("8710579e-6ab5-4122-a7eb-4cffe842e114");
	}

	public ShowRewardYielding(gearClassId: string): void {
		if (!Game.playerFlags.has("PlatformGearDownloadClassId")) {
			warn("Missing flags for platform gear download.");
			return;
		}

		print("Downloading reward gear...");
		const gear = PlatformGear.DownloadYielding(gearClassId);
		if (!gear) return;

		print("Downloaded! Showing now...");
		this.ui.SetGear(gear);
		this.container.SetActive(true);
	}

	override OnDestroy(): void {}
}
