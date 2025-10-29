import { Airship, Platform } from "@Easy/Core/Shared/Airship";
import { AirshipUser } from "@Easy/Core/Shared/Airship/Types/AirshipUser";
import { Bin } from "@Easy/Core/Shared/Util/Bin";
import { CanvasAPI, HoverState } from "@Easy/Core/Shared/Util/CanvasAPI";

export default class PartyModalMember extends AirshipBehaviour {
	public avatarImage: RawImage;
	public kickBtn: Button;
	public kickBtnWrapper: GameObject;
	public usernameText: TMP_Text;
	public usernameWrapper: GameObject;

	@NonSerialized() private user: AirshipUser;

	private bin = new Bin();
	private leaderBin = new Bin();

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

		this.kickBtn.gameObject.SetActive(false);
		this.usernameWrapper.SetActive(false);
		this.bin.AddEngineEventConnection(
			CanvasAPI.OnHoverEvent(this.avatarImage.gameObject, (hov) => {
				this.kickBtn.gameObject.SetActive(hov === HoverState.ENTER);
				this.usernameWrapper.SetActive(hov === HoverState.ENTER);
			}),
		);
	}

	public SetLeader(leader: boolean): void {
		this.leaderBin.Clean();

		if (leader && false) {
			this.kickBtnWrapper.SetActive(false);
			return;
		}
		this.kickBtnWrapper.SetActive(true);

		this.leaderBin.Add(
			this.kickBtn.onClick.Connect(async () => {
				await Platform.Client.Party.RemoveFromParty(this.user.uid);
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
