export class AirshipUrlUtil {
    public static ApplySizeToUrl(url: string, size: Vector2): string {
        return `${url}?width=${size.x}&height=${size.y}`;
    }
}