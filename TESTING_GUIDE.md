# Testing the Rating Predictor Feature

## Quick Start Guide

### 1. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. The extension should now be loaded and active

### 2. Test the Rating Predictor

#### Test on Live Contest (Recommended)
1. Go to [Codeforces](https://codeforces.com)
2. Find any running contest
3. Navigate to the contest standings page
4. Look for the new "Rating Δ" column in the standings table
5. You should see:
   - Rating change predictions (e.g., +15, -23)
   - Color-coded changes (green for positive, red for negative)
   - Update indicator in top-right corner for live contests
   - Detailed tooltips when hovering over rating changes

#### Test on Historical Contest
1. Go to any past contest standings (e.g., [Contest 1895](https://codeforces.com/contest/1895/standings))
2. The Rating Δ column should appear with predictions
3. No live updates (since contest is over)

### 3. Verify Options Integration
1. Right-click the extension icon in Chrome
2. Select "Options"
3. Find the "Rating Predictor" section
4. Toggle the feature on/off
5. Refresh a contest standings page to see the effect

### 4. Expected Behavior

#### Rating Predictions
- **Positive changes**: Green color with +XX format
- **Negative changes**: Red color with -XX format
- **No change**: Gray color with 0 format
- **Realistic ranges**: Changes typically between -150 to +150

#### Live Updates (for running contests)
- Blue update indicator in top-right corner
- Countdown showing "Next update in Xs"
- Automatic refresh every 30 seconds
- Non-intrusive updates (page doesn't flicker)

#### Tooltips
Hover over any rating change to see:
- Current estimated rating
- Predicted new rating
- Expected rank vs actual rank
- Performance assessment

### 5. Troubleshooting

#### Rating Predictor Column Missing
- Check if the extension is enabled in Chrome
- Verify you're on a contest standings page
- Check if the feature is enabled in options
- Try refreshing the page

#### Predictions Show "Loading..." or "Error"
- This is normal for a few seconds on page load
- If it persists, check browser console for errors
- Ensure you're on a valid contest page

#### No Live Updates
- Verify the contest is actually running
- Check the update indicator in top-right
- Live updates only work for ongoing contests

### 6. Testing Different Scenarios

#### Contest Types to Test
- ✅ Regular Div 1/Div 2 contests
- ✅ Educational Rounds
- ✅ Codeforces Rounds
- ✅ Gym contests (if standings available)

#### Page Types to Test
- ✅ `/contest/*/standings` - Main standings
- ✅ `/contest/*/room/*` - Room view
- ✅ `/gym/*/standings` - Gym standings

### 7. Known Limitations

1. **Rating Estimation**: Since we can't access the CF API directly, ratings are estimated from handle colors
2. **Team Contests**: Currently designed for individual contests
3. **Very Large Contests**: May have slight performance impact on 5000+ participant contests
4. **First Load**: Initial predictions may take 3-5 seconds to appear

### 8. Development Testing

If you're developing or debugging:

```bash
# Rebuild after changes
npm run build

# Check browser console for debug logs
# Look for messages starting with "[CF Enhancer]"
```

The extension logs detailed information to the browser console for debugging purposes.

### 9. Feature Verification Checklist

- [ ] Extension loads without errors
- [ ] Rating Predictor option appears in settings
- [ ] New "Rating Δ" column appears in standings
- [ ] Predictions show realistic rating changes
- [ ] Color coding works (green/red/gray)
- [ ] Tooltips show detailed information
- [ ] Live updates work for running contests
- [ ] Toggle in options enables/disables feature
- [ ] No errors in browser console
- [ ] Page performance remains good

If all items are checked, the Rating Predictor feature is working correctly!
