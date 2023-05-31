from fontTools.ttLib.ttFont import newTable
from fontmake import __main__
from fontTools.ttLib import TTFont, newTable
import shutil, subprocess, glob, sys
from pathlib import Path

def GASP_set(font:TTFont):
    if "gasp" not in font:
        font["gasp"] = newTable("gasp")
        font["gasp"].gaspRange = {}
    if font["gasp"].gaspRange != {65535: 0x000A}:
        font["gasp"].gaspRange = {65535: 0x000A}

print ("[Klee One] Generating TTFs")
for source in Path("sources").glob("*.glyphs"):
    __main__.main(("-g",str(source), "--keep-overlaps", "-o","ttf",))

for font in Path("master_ttf").glob("*.ttf"):
    modifiedFont = TTFont(font)
    print ("["+str(font).split("/")[1][:-4]+"] Adding stub DSIG")
    modifiedFont["DSIG"] = newTable("DSIG")     #need that stub dsig
    modifiedFont["DSIG"].ulVersion = 1
    modifiedFont["DSIG"].usFlag = 0
    modifiedFont["DSIG"].usNumSigs = 0
    modifiedFont["DSIG"].signatureRecords = []
    if "SemiBold" in str(font):
        modifiedFont["OS/2"].usWeightClass = 600 #it is not being set correctly in the SemiBold weight :/

    print ("["+str(font).split("/")[1][:-4]+"] Making other changes")
    modifiedFont["head"].flags |= 1 << 3        #sets flag to always round PPEM to integer
    modifiedFont["name"].addMultilingualName({'ja':'クレー One'}, modifiedFont, nameID = 1, windows=True, mac=False)
    if "SemiBold" in str(font):
        modifiedFont["name"].addMultilingualName({'ja':'SemiBold'}, modifiedFont, nameID = 2, windows=True, mac=False)
    elif "Regular" in str(font):
        modifiedFont["name"].addMultilingualName({'ja':'Regular'}, modifiedFont, nameID = 2, windows=True, mac=False)
    GASP_set(modifiedFont)
    modifiedFont.save("fonts/ttf/"+str(font).split("/")[1])

shutil.rmtree("instance_ufo")
shutil.rmtree("master_ufo")
shutil.rmtree("master_ttf")

try:
    if sys.argv[1] == "--autohinting":
        for font in Path("fonts/ttf/").glob("*.ttf"):
            print ("["+str(font).split("/")[2][:-4]+"] Autohinting")
            fontName = str(font)
            hintedName = fontName[:-4]+"-hinted.ttf"
            subprocess.check_call(
                [
                    "ttfautohint",
                    "--stem-width",
                    "nsn",
                    fontName,
                    hintedName,
                ]
            )

            shutil.move(hintedName, fontName)
except IndexError:
    pass
