import { Airship, Platform } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import { GameCoordinatorParty } from "@Easy/Core/Shared/TypePackages/game-coordinator-types";
import { AppManager } from "@Easy/Core/Shared/Util/AppManager";
import { Bin } from "@Easy/Core/Shared/Util/Bin";
import ObjectUtils from "@Easy/Core/Shared/Util/ObjectUtils";
import PartyModalMember from "./PartyModalMember";
import PartyModalPlayer from "./PartyModalPlayer";

export default class PartyModal extends AirshipBehaviour {
	@Header("Player List")
	public playerPrefab: GameObject;
	public playersParent: Transform;

	@Header("Party Member")
	public memberPrefab: GameObject;
	public membersParent: Transform;

	@Header("Invites")
	public invitePrefab: GameObject;
	public invitesParent: Transform;

	@Header("Other")
	public bgButton: Button;
	public window: RectTransform;
	public leaveBtn: Button;

	private uidToPartyMember = new Map<string, PartyModalMember>();
	private bin = new Bin();

	override Start(): void {
		this.window.localScale = Vector3.one.mul(1.1);
		NativeTween.LocalScale(this.window, Vector3.one, 0.12).SetEaseQuadOut();

		this.leaveBtn.gameObject.SetActive(false);

		this.membersParent.gameObject.ClearChildren();
		task.spawn(async () => {
			const party = await Platform.Client.Party.GetParty();
			this.UpdateParty(party);
			Platform.Client.Party.onPartyChange.Connect((p: GameCoordinatorParty.PartySnapshot) => {
				this.UpdateParty(p);
			});
		});

		this.bin.Add(
			this.bgButton.onClick.Connect(() => {
				AppManager.Close();
			}),
		);

		this.playersParent.gameObject.ClearChildren();
		this.bin.Add(
			Airship.Players.ObservePlayers((p) => {
				// if (p.IsLocalPlayer()) return;

				const go = Instantiate(this.playerPrefab, this.playersParent);
				const modalPlayer = go.GetAirshipComponent<PartyModalPlayer>()!;
				modalPlayer.Init(p);

				return () => {
					Destroy(go);
				};
			}),
		);

		this.bin.Add(
			this.leaveBtn.onClick.Connect(async () => {
				await Platform.Client.Party.RemoveFromParty(Game.localPlayer.userId);
			}),
		);

		// Invites
		this.invitesParent.gameObject.ClearChildren();
	}

	private UpdateParty(party: GameCoordinatorParty.PartySnapshot): void {
		this.leaveBtn.gameObject.SetActive(party.members.size() > 1);

		for (let user of party.members) {
			if (this.uidToPartyMember.has(user.uid)) {
				const partyMemberComp = this.uidToPartyMember.get(user.uid)!;
				partyMemberComp.SetLeader(user.uid === party.leader);
				continue;
			}

			const go = Instantiate(this.memberPrefab, this.membersParent);
			const partyMemberComp = go.GetAirshipComponent<PartyModalMember>()!;
			partyMemberComp.Init(user);
			partyMemberComp.SetLeader(user.uid === party.leader);
			this.uidToPartyMember.set(user.uid, partyMemberComp);
		}

		const toRemove = [];
		for (let uid of ObjectUtils.keys(this.uidToPartyMember)) {
			if (party.members.find((p) => p.uid === uid) === undefined) {
				toRemove.push(uid);
			}
		}
		for (let uid of toRemove) {
			Destroy(this.uidToPartyMember.get(uid)!.gameObject);
			this.uidToPartyMember.delete(uid);
		}
	}

	override OnDestroy(): void {
		this.bin.Clean();
	}
}
