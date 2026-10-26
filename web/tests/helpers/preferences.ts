import type { Page } from '@playwright/test';
export async function follow(page:Page,side:'NORTH'|'SOUTH'|'') { await page.getByRole('button',{name:/^Favorite team:/}).click();await page.getByRole('menuitemradio',{name:side==='NORTH'?'Manchester City':side==='SOUTH'?'Manchester United':'Both teams',exact:true}).click(); }
