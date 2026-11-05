# App layout and width

**Area code:** `LAY`  ·  **Status:** agreed

## Why

The app is capped at 1024 px and centred, so on a tablet or laptop a lot of the screen is empty on a tablet or laptop. The app should use the full width, with the song grid showing more tiles per row.

## Scope

- In: the width of the app in performance mode, the arrangement of buttons, STOP and songs, and the width of Edit mode.
- Out: the number of button columns (BTN-01 stays 4 per row on phones and 8 from `sm`), the song tiles (see SONG-20 to 26), and the dialogs.

## Acceptance criteria

### Width
- [ ] **LAY-01** In performance mode the app uses the whole window width. The 1024 px cap is removed.
- [ ] **LAY-02** The window can be any width from 320 px up without a horizontal scrollbar.

### Arrangement
- [ ] **LAY-10** At every width the status row, occasion buttons and STOP are on top, and the song area is below them, scrolling on its own.
- [ ] **LAY-11** ~~Two columns from 1024 px.~~ (removed 2026-11-05: the DJ wants the tiles under the buttons on wide screens too)
- [ ] **LAY-12** ~~Column proportions.~~ (removed)
- [ ] **LAY-13** ~~Only the song area scrolls in two columns.~~ (removed)
- [ ] **LAY-14** The occasion buttons keep 4 per row on phones and 8 per row from `sm` (BTN-01) at every width. The song grid adds tile columns as the window gets wider.

### Edit mode
- [ ] **LAY-20** Edit mode keeps a readable width: its content is centred with a maximum width of 48 rem.
- [ ] **LAY-21** Dialogs (Help, About, New / Open event, device picker) keep their current size and are centred.

## Open questions

- [x] **LAY-90** ~~Switch to two columns at 1024 px.~~ (removed with LAY-11)
- [x] **LAY-91** ~~Landscape phone layout.~~ (removed with LAY-11)

## Notes

Today the cap is `max-w-5xl` on the app container in `App.tsx`. The grid (F-017) and this feature fit together: the song area gets its own width, and the number of tile columns follows it.
