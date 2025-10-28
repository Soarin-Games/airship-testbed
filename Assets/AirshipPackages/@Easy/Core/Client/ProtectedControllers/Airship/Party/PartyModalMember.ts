import { Airship, Platform } from "@Easy/Core/Shared/Airship";
import { AirshipUser } from "@Easy/Core/Shared/Airship/Types/AirshipUser";
import { Bin } from "@Easy/Core/Shared/Util/Bin";

export default class PartyModalMember extends AirshipBehaviour {
	public avatarImage: RawImage;
	public kickBtn: Button;
	public usernameText: TMP_Text;

	@NonSerialized() private user: AirshipUser;

	private bin = new Bin();

	public Init(user: AirshipUser): void {
		this.bin.Clean();

		this.user = user;
		this.usernameText.text = user.username;
		task.spawn(async () => {
			const tex = await Airship.Players.GetProfilePictureAsync(user.uid);
			if (this.avatarImage) {
				this.avatarImage.texture = tex;
			}
		});

		this.bin.Add(
			this.kickBtn.onClick.Connect(async () => {
				await Platform.Client.Party.RemoveFromParty(user.uid);
			}),
		);
	}

	public SetPartyLeader(leader: boolean): void {
		this.kickBtn.gameObject.SetActive(leader);
	}

	override Start(): void {}

	override OnDestroy(): void {
		this.bin.Clean();
	}
}
