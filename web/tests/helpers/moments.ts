import { expect, type Page } from "@playwright/test";
import type { Story, View } from "../../src/contracts";
/** Clusters retain original IDs. Open their list before using the actual incident control. */
export async function revealMoment(page: Page, id: string) {
  const button=page.locator(`.md-moments button[data-story-id="${id}"]`);
  await expect(button).toHaveCount(1);
  const popup=button.locator('xpath=ancestor::*[contains(@class,"axis-cluster-popup")]');
  if(await popup.count()) {
    const popupId=await popup.getAttribute('id');
    if(await popup.isHidden()) await page.locator(`[aria-controls="${popupId}"]`).click();
  }
  await expect(button).toBeVisible(); return button;
}
export async function selectStoryKind(page: Page, scenario: string, clock: number, kind='observed_shot'): Promise<Story> {
  const view: View=await(await page.request.get(`/api/view?scenario=${scenario}&clock=${clock}&audience=fan`)).json();
  const story=[...view.timeline].reverse().find(s=>s.type===kind)!;expect(story).toBeTruthy();
  await (await revealMoment(page,story.id)).click();return story;
}
