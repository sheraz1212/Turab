# Caption / SFX timing for the Great Escape short (used by ../cloud_finish.py).
DUR = 1680 / 24
VOICE = None  # put the ElevenLabs voiceover wav path here when available
LINES = [
    (0.2, "You're a prisoner of war, and you dig a hole to escape."),
    (3.8, "But the guards crawl under every hut with flashlights."),
    (6.8, "So you hide the entrance under a hot stove. Nobody looks there."),
    (10.6, "Then they bury microphones in the ground to hear you dig."),
    (14.0, "So you go down thirty feet. Too deep to hear."),
    (17.1, "But the sand keeps collapsing."),
    (18.9, "So you tear the boards out of your beds, and build walls."),
    (22.6, "Now you dig sideways."),
    (24.2, "But this deep, the sand is bright yellow. One grain on the grey ground, and they know."),
    (29.6, "So you hide it in bags inside your trousers, and sprinkle it in the gardens."),
    (34.2, "Down here, the air runs out. So you build a pump from kit bags, and pipes from milk tins."),
    (40.0, "The tunnel gets so long that crawling takes forever. So you lay rails, and ride a trolley."),
    (45.2, "Then the guards find your tunnel, and blow it up."),
    (48.4, "But you didn't dig one tunnel. You dug three. Tom, Dick, and Harry."),
    (52.6, "Harry stretches three hundred thirty-six feet, under the fence."),
    (55.8, "On escape night, you break through the snow, and the tunnel comes up short of the trees. Right next to a guard tower."),
    (62.8, "One by one, seventy-six men crawl out into the dark."),
    (66.0, "Congratulations. You have built the Great Escape tunnel."),
]
BIG = [(14.6, 17.0, "30 FT", 0.12), (52.6, 55.6, "336 FT", 0.12), (62.8, 65.8, "76", 0.12)]
CUES = [("wind", 0, 1.0), ("metal", 7.2, 1.0), ("crackle", 8.3, 1.0), ("pulse", 11.6, 1.0), ("pulse", 12.5, 1.0), ("pulse", 13.3, 1.0),
        ("beep", 11.65, 1.0), ("beep", 12.5, 1.0), ("beep", 13.35, 1.0), ("whoosh", 14.6, 1.0), ("slide", 17.2, 1.0),
        ("boom", 47.15, 1.1), ("rumble", 47.5, 1.0), ("pop", 48.6, 1.0), ("pop", 50.0, 1.0), ("pop", 50.6, 1.0), ("chime", 51.0, 1.0),
        ("pop", 24.4, 1.0), ("chime", 25.2, 0.8), ("swell", 52.6, 1.0), ("whoosh", 55.6, 0.6), ("chord", 66.0, 1.0)]
RANGES = [("scrape", 0.5, 6.6, 0.3, 0.45), ("scrape", 10.9, 13.8, 0.3, 0.4), ("scrape", 14.0, 17.0, 0.3, 0.4), ("scrape", 22.6, 24.0, 0.26, 0.4),
          ("step", 3.8, 6.6, 0.3, 0.35), ("step", 9.3, 10.9, 0.3, 0.35), ("tok", 19.0, 22.4, 0.21, 0.8),
          ("step", 25.1, 28.8, 0.27, 0.5), ("trickle", 29.6, 34.0, 10, 1.0), ("step", 29.6, 34.0, 0.29, 0.5),
          ("wheeze", 34.3, 45.0, 0.83, 1.0), ("clack", 40.2, 44.8, 0.18, 1.0), ("crunch", 60.4, 62.6, 0.35, 0.8),
          ("heart", 62.8, 66.0, 0.8, 1.0), ("step", 62.8, 66.0, 0.2, 0.5), ("scrape", 55.8, 57.5, 0.3, 0.3)]
