import type { GameContext, GameInstance } from '../../core/types';
import { renderIntro } from '../../ui/intro';

// Placeholder until the game is built.
export function mount(host: HTMLElement, ctx: GameContext): GameInstance {
  host.replaceChildren(renderIntro(ctx.game, { onStart: () => undefined }));
  return { destroy: () => host.replaceChildren() };
}
