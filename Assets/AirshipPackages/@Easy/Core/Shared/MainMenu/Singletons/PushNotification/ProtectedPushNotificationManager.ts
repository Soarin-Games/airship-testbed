import { CoreContext } from "@Easy/Core/Shared/CoreClientContext";
import { Game } from "@Easy/Core/Shared/Game";

const enum PushNotificationPermission {
	NotDetermined = 0,
	Authorized = 1,
	Denied = 2,
}

interface PushNotificationManager {
	RegisterForPushNotificationAsync(): void;
	GetPushNotificationPermission(): PushNotificationPermission;
}

declare const PushNotificationManager: PushNotificationManager;

export default class ProtectedPushNotificationManager extends AirshipBehaviour {
	override Start(): void {
		if (Game.coreContext === CoreContext.MAIN_MENU && Game.IsMobile()) {
			const perm = PushNotificationManager.GetPushNotificationPermission();
			if (perm === PushNotificationPermission.Authorized) {
				PushNotificationManager.RegisterForPushNotificationAsync();
			} else if (perm === PushNotificationPermission.NotDetermined) {
				PushNotificationManager.RegisterForPushNotificationAsync();
			}
		}
	}

	override OnDestroy(): void {}
}
