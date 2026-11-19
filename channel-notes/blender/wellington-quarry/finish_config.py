# Caption / SFX timing for the Wellington Quarry (Arras) short (used by ../cloud_finish.py).
DUR = 1584 / 24
VOICE = None  # ElevenLabs voiceover wav path, when available
LINES = [
    (0.2, "You dig a hole under a city that's being shelled."),
    (3.6, "Down there, you find something nobody remembers. Medieval chalk quarries. Huge, empty caves."),
    (8.4, "So you connect them. Cave to cave, with tunnels."),
    (11.6, "But the chalk is soft, and the roof starts to crack."),
    (14.6, "So you hold it up with timber, beam by beam."),
    (17.4, "Above you, the enemy listens for digging."),
    (19.8, "So you dig quietly, with hand tools, and they never hear a thing."),
    (23.6, "You need light. So you run electric cables through the caves."),
    (27.0, "You need water. So you pipe it in."),
    (29.2, "You need to move fast. So you lay a railway."),
    (32.0, "Soldiers will get hurt. So you build a hospital. Seven hundred beds. Underground."),
    (36.8, "You name every cave after a town back home. Wellington. Auckland. Nelson."),
    (41.4, "Then, one night, twenty-four thousand soldiers walk in. And disappear."),
    (46.2, "Up above, the enemy sees an empty city."),
    (48.6, "Below them, you dig the last few meters, right under their front line."),
    (52.8, "At five thirty in the morning, in the snow, the exits blow open."),
    (56.8, "And thousands of soldiers rise out of the ground, right on top of the enemy."),
    (61.4, "Congratulations. You have built the tunnels under Arras."),
]
BIG = [(33.6, 36.6, "700 BEDS", 0.12), (43.0, 46.0, "24,000", 0.12), (52.8, 55.0, "5:30 AM", 0.12)]
CUES = [("wind", 0, 1.0), ("boom", 0.25, 1.0), ("boom", 2.15, 1.0), ("pop", 3.8, 1.0), ("pop", 4.8, 1.0), ("pop", 5.8, 1.0), ("pop", 6.8, 1.0),
        ("chime", 6.8, 0.8), ("slide", 12.2, 1.0), ("rumble", 12.0, 0.8), ("chime", 16.0, 0.8),
        ("pulse", 17.6, 1.0), ("pulse", 18.4, 1.0), ("pulse", 19.2, 1.0), ("beep", 24.2, 1.0), ("beep", 24.8, 1.0), ("beep", 25.4, 1.0), ("beep", 26.0, 1.0),
        ("whoosh", 27.2, 0.8), ("pop", 37.0, 1.0), ("pop", 37.7, 1.0), ("pop", 38.3, 1.0), ("pop", 39.0, 1.0), ("chime", 39.4, 0.8),
        ("boom", 42.4, 0.6), ("swell", 43.0, 1.0), ("whoosh", 46.2, 0.6), ("boom", 54.0, 1.2), ("boom", 54.6, 1.2), ("chord", 61.4, 1.0)]
RANGES = [("scrape", 0.3, 3.4, 0.3, 0.45), ("scrape", 8.5, 11.4, 0.28, 0.4), ("tok", 14.8, 17.2, 0.21, 0.8), ("scrape", 20.0, 23.4, 0.45, 0.2),
          ("clack", 29.6, 32.0, 0.18, 1.0), ("pop", 32.3, 33.5, 0.12, 0.7), ("step", 41.6, 46.0, 0.12, 0.35),
          ("scrape", 50.0, 52.4, 0.3, 0.4), ("heart", 48.8, 52.6, 0.8, 1.0), ("crunch", 55.2, 61.0, 0.2, 0.6), ("step", 56.8, 61.4, 0.15, 0.4)]
