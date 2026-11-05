# App layout and width

**Area code:** `LAY`  ·  **Status:** draft

## Why

The app is capped at 1024 px and centred, so on a tablet or laptop a lot of the screen is empty, and the DJ has to scroll the song list under the buttons. On wide screens the buttons and the songs should both be in view at once.

## Scope

- In: the width of the app in performance mode, the arrangement of buttons, STOP and songs on wide screens, and the width of Edit mode.
- Out: the number of button columns (BTN-01 stays 4 per row on phones and 8 from `sm`), the song tiles (see SONG-20 to 26), and the dialogs.

## Acceptance criteria

### Width
- [ ] **LAY-01** In performance mode the app uses the whole window width. The 1024 px cap is removed.
- [ ] **LAY-02** The window can be any width from 320 px up without a horizontal scrollbar.

### Narrow screens (below 1024 px)
- [ ] **LAY-10** Below 1024 px the layout is as today: status row, occasion buttons and STOP on top, the song area below and scrolling on its own.

### Wide screens (1024 px and up)
- [ ] **LAY-11** From 1024 px the status row spans the full width. Below it are two columns: occasion buttons and STOP on the left, songs on the right.
- [ ] **LAY-12** The left column takes about 3/5 of the width and the right column about 2/5.
- [ ] **LAY-13** Both columns fit in the window height without the page scrolling. Only the song area scrolls (with its own scrollbar).
- [ ] **LAY-14** The occasion buttons keep 8 per row and the same proportions as today, so they do not stretch into very wide buttons.

### Edit mode
- [ ] **LAY-20** Edit mode keeps a readable width: its content is centred with a maximum width of 48 rem.
- [ ] **LAY-21** Dialogs (Help, About, New / Open event, device picker) keep their current size and are centred.

## Open questions

- [?] **LAY-90** The switch to two columns is proposed at 1024 px (`lg`). A tablet in portrait (about 768 px) would get the stacked layout. Is that right?
- [?] **LAY-91** A phone in landscape is wide enough for two columns only above 1024 px, which most phones are not. Is the stacked layout acceptable there?

## Notes

Today the cap is `max-w-5xl` on the app container in `App.tsx`. The grid (F-017) and this feature fit together: the song area gets its own width, and the number of tile columns follows it.
