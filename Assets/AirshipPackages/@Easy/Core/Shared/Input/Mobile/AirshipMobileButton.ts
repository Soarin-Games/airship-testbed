import AirshipButton from "../../MainMenu/Components/AirshipButton";
import { Signal } from "../../Util/Signal";

export default class AirshipMobileButton extends AirshipButton {
	/** The icon of this mobile button */
	@Header("Mobile Button")
	public iconImage: Image;
	private startingImageAlpha: number;
	private startingIconAlpha: number;

	@Header("Cooldown")
	public hasCooldown = false;
	public cooldownTime = 5; // maximum/default cooldown time in seconds
	public activeColor = new Color(1, 1, 1);
	public cooldownColor = new Color(0.5, 0.5, 0.5);
	public cooldownImage: Image;
	public progressFill: Image;
	public cooldownText: TMP_Text;
	public onCooldownEnded: Signal;
	private isOnCooldown = false;
	private lastUsedTime = 0;
	private nextOffCooldownTime = 0;

	override Start(): void {
		super.Start();
		this.startingImageAlpha = this.image?.color.a ?? 1;
		this.startingIconAlpha = this.iconImage.color.a;
	}

	protected Update(dt: number): void {
		if (!this.hasCooldown) return;

		/** Set button off cooldown */
		if (this.nextOffCooldownTime <= Time.time) {
			this.UpdateCooldownState(false, 1);
			return;
		}

		/** Handle on cooldown */
		// Handle case where we set this.cooldownTime lower than the current in progress cooldown
		// e.g. Leveled up -> lower cooldowns, gained a CDR buff, etc.
		// We never want to have a 110%, 120% etc. cooldown, so we should clamp to 100% CD
		if (this.nextOffCooldownTime - this.lastUsedTime > this.cooldownTime) {
			this.nextOffCooldownTime = Time.time + this.cooldownTime;
		}
		const remainingCooldownTime = this.nextOffCooldownTime - Time.time;
		this.cooldownText.text = math.ceil(remainingCooldownTime) + "";
		this.progressFill.fillAmount = 1 - remainingCooldownTime / this.cooldownTime;
	}

	public SetIconFromSprite(sprite: Sprite) {
		this.iconImage.sprite = sprite;
	}

	public SetIconFromTexture(texture: Texture2D) {
		this.iconImage.sprite = Bridge.MakeDefaultSprite(texture);
	}

	public FadeOut(duration: number = 0.5): void {
		if (this.image && this.iconImage) {
			NativeTween.GraphicAlpha(this.image, 0, duration).SetUseUnscaledTime(true);
			NativeTween.GraphicAlpha(this.iconImage, 0, duration).SetUseUnscaledTime(true);
		}
	}

	public FadeIn(duration: number = 0.5): void {
		if (this.image && this.iconImage && this.startingImageAlpha && this.startingIconAlpha) {
			NativeTween.GraphicAlpha(this.image, this.startingImageAlpha, duration).SetUseUnscaledTime(true);
			NativeTween.GraphicAlpha(this.iconImage, this.startingIconAlpha, duration).SetUseUnscaledTime(true);
		}
	}

	private UpdateCooldownState(shouldSetOnCooldown: boolean, cooldownPercent: number, cancelVFX?: boolean) {
		if (!this.hasCooldown) return;

		if (shouldSetOnCooldown && !this.isOnCooldown) {
			this.iconImage.color = this.cooldownColor;
			this.button.enabled = false;
		} else if (!shouldSetOnCooldown && this.isOnCooldown) {
			this.iconImage.color = this.activeColor;
			this.button.enabled = true;
			this.onCooldownEnded.Fire();
		}

		this.isOnCooldown = shouldSetOnCooldown;
		this.cooldownImage.fillAmount = cooldownPercent;
	}

	/**
	 * Puts this button on cooldown.
	 * @param cooldownTime Amount of time before the button can be used again. Only use this for cases
	 * such as refunding partial cooldowns; This function defaults to setting the button on the cooldown
	 * time defined by this.cooldownTime
	 */
	public SetOnCooldown(cooldownTime?: number) {
		if (!this.hasCooldown) {
			warn("Attempt to set cooldown time on a button that does not have cooldowns enabled.");
			return;
		}
		if (cooldownTime && cooldownTime > this.cooldownTime) {
			warn("Attempt to set cooldown time higher than the maximum this.cooldownTime.");
			return;
		}

		this.nextOffCooldownTime = Time.time + (cooldownTime ?? this.cooldownTime);
	}

	/**
	 * Sets the default/maximum cooldown for this button in seconds. If the in progress cooldown time
	 * is greater than cooldownTime, the cooldown will reset to 100% and tick down from the new cooldown
	 * time provided.
	 * @param cooldownTime New default/maximum cooldown for this button in seconds
	 * */
	public SetCooldownTime(cooldownTime: number) {
		if (!this.hasCooldown) {
			warn("Attempt to set cooldown time on a button that does not have cooldowns enabled.");
			return;
		}
		this.cooldownTime = cooldownTime;
	}

	/**
	 * Sets the lastUsedTime for this button, which is used to determine cooldowns. Only use this function
	 * if you have a distinct need to go forwards or backwards in time, e.g. in a predicted command
	 * system. Otherwise call SetOnCooldown at the moment of button use.
	 * @param lastUsedTime
	 */
	public SetLastUsedTime(lastUsedTime: number) {
		this.lastUsedTime = lastUsedTime;
	}
}
