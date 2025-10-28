import { Platform } from "@Easy/Core/Shared/Airship";
import PartyModalMember from "./PartyModalMember";

export default class PartyModal extends AirshipBehaviour {
	public memberPrefab: GameObject;
	public membersParent: Transform;
	public uidToPartyMember = new Map<string, PartyModalMember>();

	override Start(): void {
		this.membersParent.gameObject.ClearChildren();
		task.spawn(async () => {
			const party = await Platform.Client.Party.GetParty();
			for (let user of party.members) {
				const go = Instantiate(this.memberPrefab, this.membersParent);
				const partyMemberComp = go.GetAirshipComponent<PartyModalMember>()!;
				partyMemberComp.Init(user);
			}
		});
	}

	override OnDestroy(): void {}
}
