export default class GearUnlockUI extends AirshipBehaviour {
	public camera: Camera;
	public targetGearParent: Transform;
	public accessory: AccessoryComponent;

	private targetGearCenter = Vector3.zero;

	override Start(): void {
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

	public SetGear(gear: PlatformGear): void {
		this.targetGearParent.gameObject.ClearChildren();
		const go = Instantiate(gear.accessoryPrefabs[0], this.targetGearParent);
		go.localPosition = Vector3.zero;
		go.localRotation = Quaternion.identity;
		this.accessory = go;
	}

	protected Update(dt: number): void {
		const cameraTransform = this.camera.transform;
		cameraTransform.position = this.targetGearCenter.add(new Vector3(0, 0, -3));
		cameraTransform.LookAt(this.targetGearCenter);

		this.targetGearParent.Rotate(Vector3.up.mul(40 * dt), Space.Self);
	}

	override OnDestroy(): void {}
}
