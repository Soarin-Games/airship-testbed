import { Airship } from "@Easy/Core/Shared/Airship";
import { GameCoordinatorParty } from "@Easy/Core/Shared/TypePackages/game-coordinator-types";
import { Bin } from "@Easy/Core/Shared/Util/Bin";

export default class PartyModalInvite extends AirshipBehaviour {
	public leaderAvatarImg: RawImage;
	public leaderUsername: TMP_Text;
	public othersText: TMP_Text;
	public denyBtn: Button;
	public acceptBtn: Button;

	private bin = new Bin();

	public Init(party: GameCoordinatorParty.PartySnapshot): void {
		task.spawn(async () => {
			const tex = await Airship.Players.GetProfilePictureAsync(party.leader);
			this.leaderAvatarImg.texture = tex;
		});
		const leaderMember = party.members.find((m) => m.uid === party.leader)!;
		this.leaderUsername.text = leaderMember.username;

		if (party.members.size() > 1) {
			this.othersText.gameObject.SetActive(true);
			this.othersText.text = `+${party.members.size() - 1} others`;
		} else {
			this.othersText.gameObject.SetActive(false);
		}

		this.bin.Add(
			this.acceptBtn.onClick.Connect(() => {
				// todo: join party
			}),
		);

		this.bin.Add(
			this.denyBtn.onClick.Connect(() => {
				Destroy(this.gameObject);
			}),
		);
	}

	override Start(): void {}

	override OnDestroy(): void {
		this.bin.Clean();
	}
}
