const files = import.meta.glob('/assets/art/*.png', { eager: true, import: 'default' }) as Record<string, string>

/** 返回 assets/art 下位图的 URL；未入库返回 null，由调用方降级 */
export function artUrl(name: string): string | null {
  return files[`/assets/art/${name}`] ?? null
}
