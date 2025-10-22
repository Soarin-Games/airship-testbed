import { Game } from "@Easy/Core/Shared/Game";
import { Bin } from "@Easy/Core/Shared/Util/Bin";

export default class GearUnlockUI extends AirshipBehaviour {
	public camera: Camera;
	public targetGearParent: Transform;
	public accessory: AccessoryComponent;
	@NonSerialized()
	public renderTexture: RenderTexture;
	public rawImage: RawImage;

	public continueBtn: Button;
	public verticalList: VerticalLayoutGroup;

	private targetGearCenter = Vector3.zero;
	private bin = new Bin();

	override OnEnable(): void {
		if (this.renderTexture) {
			this.renderTexture.Release();
			Destroy(this.renderTexture);
		}
		this.rawImage.enabled = false;
		this.renderTexture = new RenderTexture(Screen.width, Screen.height, 24, RenderTextureFormat.ARGB32);
		this.camera.targetTexture = this.renderTexture;
		this.rawImage.texture = this.renderTexture;

		this.bin.Add(
			this.continueBtn.onClick.Connect(() => {
				this.gameObject.SetActive(false);
			}),
		);

		if (Game.deviceType !== AirshipDeviceType.Phone) {
			const rect = this.verticalList.transform as RectTransform;
			rect.anchoredPosition = new Vector2(0, 150);
		}
	}

	protected OnDisable(): void {
		this.bin.Clean();
		if (this.renderTexture) {
			this.renderTexture.Release();
			Destroy(this.renderTexture);
		}
	}

	public SetGear(gear: PlatformGear): void {
		this.rawImage.enabled = true;
		this.targetGearParent.gameObject.ClearChildren();
		const acc = Instantiate(gear.accessoryPrefabs[0], this.targetGearParent);
		acc.gameObject.SetLayerRecursive(17);
		acc.transform.localPosition = Vector3.zero;
		acc.transform.localRotation = Quaternion.Euler(-90, 0, 0);
		this.accessory = acc;

		const meshRenderer = this.accessory.gameObject.GetComponentInChildren<MeshRenderer>();
		if (meshRenderer) {
			this.targetGearCenter = meshRenderer.bounds.center;
		} else {
			const skinnedMeshRenderer = this.accessory.gameObject.GetComponentInChildren<SkinnedMeshRenderer>();
			if (skinnedMeshRenderer) {
				this.targetGearCenter = skinnedMeshRenderer.bounds.center;
			}
		}
	}

	protected Update(dt: number): void {
		const cameraTransform = this.camera.transform;
		cameraTransform.position = this.targetGearCenter.add(new Vector3(0, 0, -3.5));
		cameraTransform.LookAt(this.targetGearCenter);

		this.targetGearParent.RotateAround(this.targetGearCenter, Vector3.up, -35 * dt);
	}

	override OnDestroy(): void {}
}
