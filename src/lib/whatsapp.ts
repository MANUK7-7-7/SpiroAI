/** wa.me needs the number as digits only, with country code. */
export const whatsappUrl = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

/**
 * Opens WhatsApp in a new tab so SpiroAI stays open. The tab is opened during the click, before any await,
 * because browsers block tabs opened later. Falls back to the current tab only if the browser blocked it.
 */
export async function openInNewTab(getUrl: () => Promise<string | null | undefined> | string | null | undefined) {
  const tab = window.open("", "_blank");
  const url = await getUrl();
  if (!url) {
    tab?.close();
    return false;
  }
  if (tab) {
    tab.opener = null;
    tab.location.href = url;
  } else window.location.href = url;
  return true;
}
