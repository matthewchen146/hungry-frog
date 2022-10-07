// credits
// inverse kinematics referenced from The Coding Train

title = "Hungry Frog";

description = `[Hold] to Eat
`;

characters = [
// a - frog eye
`
 gggg 
gggggg
gggggg
gppppg
gggggg
 gggg
`,
// b - frog tongue
`
  RR  
 RRRR 
RRRRRR
RRRRRR
 RRRR 
  RR  
`,
// c - bug body
`
      
 bbbb 
bbbbbb
bbbbbb
 bbbb 
b    b
`,
// d - wing open
`
 bbbb 
b    b
b    b
b    b
b    b
 bbbb 
`,
// e - wing close
`
      
      
 bbbb 
b    b
 bbbb 
      
`,
// f - frog eye dead
`
 gggg 
gpggpg
ggppgg
ggppgg
gpggpg
 gggg
`,
];

options = {
    theme: 'simple',
    isPlayingBgm: true,
};


let bugs = [];
let possibleBugColors = ['red', 'blue', 'purple'];
let bugTypes = [
    {
        color: 'red',
        score: 30,
        speed: .7,
        height: 30,
        amplitude: 20
    },
    {
        color: 'purple',
        score: 20,
        speed: .5,
        height: 40,
        amplitude: 20
    },
    {
        color: 'blue',
        score: 10,
        speed: .2,
        height: 55,
        amplitude: 10
    },
];
let spawnBug = () => {
    let prob = Math.random();
    let type;
    if (prob < .5) {
        type = bugTypes[2];
    } else if (prob < .8) {
        type = bugTypes[1];
    } else {
        type = bugTypes[0];
    }

    // type = bugTypes[rndi(0,bugTypes.length)];
    let rand = Math.random();
    let bug = {
        score: type.score,
        isDestroyed: false,
        isCaught: false,
        seed: Math.random(),
        speed: type.speed + Math.random() * .1,
        pos: vec((rand > .5) ? -10 : 110, type.height),
        dir: (rand > .5) ? 1 : -1,
        color: type.color,
        startTimestamp: Date.now(),
        height: type.height - Math.random() * 5,
        amplitude: type.amplitude + Math.random() * 5,
        draw: () => {
            color(bug.color);
            // wing flap
            let choose = (Math.round(ticks * .5)) % 2;
            let wing = (choose == 0 ? 'd' : 'e');
            char(wing, bug.pos.x + 3, bug.pos.y - 3);
            char(wing, bug.pos.x - 3, bug.pos.y - 3);
            // body
            char('c', bug.pos.x, bug.pos.y);
            color('black');
        },
        update: () => {

            if (!bug.isCaught) {
                
                bug.pos.y = bug.height + Math.sin(ticks * .03) * bug.amplitude;
                bug.pos.x += bug.dir * bug.speed;

                if ((bug.dir > 0 && bug.pos.x > 110) || (bug.dir < 0 && bug.pos.x < -10)) {
                    bug.isDestroyed = true;
                }

            }
            
        }
    }
    bugs.push(bug);
    console.log('bug spawned')
}



let maxTongueLength = 20;
let tongueLength = 0;
let tongueSegmentLength = 1;
let tongueSegments = [];
for (let i = 0; i < 5; i++) {
    let seg = {
        length: 10,
        start: vec(0,0),
        end: vec(0,0),
        angle: 0,
        calculateEnd: () => {
            seg.end.set(vec(seg.start).add(tongueSegmentLength * Math.cos(seg.angle), tongueSegmentLength * Math.sin(seg.angle)));
        }
    }

    tongueSegments.push(seg);
}

let frog = {
    color: 'green',
    pos: vec(0,0),
    tongueTipPos: vec(0,0),
    tongueTarget: undefined,
    tongueExtension: vec(0,0),
    height: 20,
    mouthY: 0,
    mouthWidth: 0,
    mouthHeight: 0,
    caughtBug: undefined,
    isMouthOpen: false,
    drawBody: () => {
    
        let bodySize = vec(20, frog.height);
        let legSize = vec(bodySize.x + 8,6);
        let feetSize = vec(legSize.x + 4,2);
    
        // body
        color(frog.color);
        rect(frog.pos.x - bodySize.x * .5, frog.pos.y - bodySize.y, bodySize.x, bodySize.y);
        rect(frog.pos.x - legSize.x * .5, frog.pos.y - legSize.y, legSize.x, legSize.y);
        rect(frog.pos.x - feetSize.x * .5, frog.pos.y - feetSize.y, feetSize.x, feetSize.y);
    
        // cheeks
        let cheekSize = vec(bodySize.x + 4, 4);
        rect(frog.pos.x - cheekSize.x * .5, frog.pos.y - bodySize.y + 3, cheekSize.x, cheekSize.y);
    
        // mouth
        color('light_red');
        let mouthWidth = bodySize.x - 6;
        frog.mouthWidth = mouthWidth;
        let mouthY = frog.pos.y - bodySize.y + 4;
        frog.mouthY = mouthY;
        rect(frog.pos.x - mouthWidth * .5, mouthY, mouthWidth, 6);
    
        // eyes
        color('black');
        let leftEyePos = vec(frog.pos.x - bodySize.x * .5 + 2, frog.pos.y - bodySize.y);
        let rightEyePos = vec(frog.pos.x + bodySize.x * .5 - 2, frog.pos.y - bodySize.y);
        char(life <= 0 ? 'f' : 'a', leftEyePos.x, leftEyePos.y);
        char(life <= 0 ? 'f' : 'a', rightEyePos.x, rightEyePos.y);
    
        // pupils
        // color('purple');
        // rect(leftEyePos.x, leftEyePos.y, 1,1);
        // rect(rightEyePos.x, rightEyePos.y, 1,1);
    
        color('black');
    
    
        // tongue
        tongueSegmentLength = tongueLength / tongueSegments.length;
    
        for (let i = 0; i < tongueSegments.length; i++) {
            let seg = tongueSegments[i];
    
            // follow target
            let target;
            if (i === 0) {
                if (frog.tongueTarget) {
                    target = vec(frog.tongueTarget);
                } else if (frog.tongueExtension) {
                    target = vec(frog.pos.x, mouthY).add(frog.tongueExtension.x, -frog.tongueExtension.y);
                } else {
                    target = vec(50,20);
                }
            } else {
                target = vec(tongueSegments[i - 1].start);
            }
            let dir = vec(target).sub(seg.start).normalize();
            seg.angle = dir.angle;
    
            dir.mul(-tongueSegmentLength);
            seg.start.set(vec(target).add(dir));
    
            // calculate end
            seg.calculateEnd();
        }
    
    
        // set base
        let baseSeg = tongueSegments[tongueSegments.length - 1];
        baseSeg.start.set(frog.pos.x, mouthY + 2); // at mouth
        baseSeg.calculateEnd();
    
    
        for (let j = tongueSegments.length - 2; j >= 0; j--) {
            let nextSeg = tongueSegments[j];
            nextSeg.start.set(tongueSegments[j + 1].end);
            nextSeg.calculateEnd();
        }
    
        // draw segments
        if (tongueLength > 3) {
            color('light_red');
            for (let seg of tongueSegments) {
                line(seg.start, seg.end, 2);
            }
    
            // tongue tip
            if (tongueLength > 3) {
                let endSeg = tongueSegments[0];
                frog.tongueTipPos.set(endSeg.end);
                char('b', frog.tongueTipPos.x, frog.tongueTipPos.y);
            }
            frog.isMouthOpen = true;
        } else {
            frog.isMouthOpen = false;
        }
        color('black');

        
    },

    drawChin: () => {
        // chin
        color(frog.color);
        rect(frog.pos.x - frog.mouthWidth * .5, frog.mouthY + frog.mouthHeight || 1, frog.mouthWidth, 6);
        color('black');
    }
}

let extendY = 0;
let extendFallFactor = 0;

let maxEnergy = 10;
let energy = maxEnergy;

let life = 100;

let bugSpawnTimestamp = 0;
let bugSpawnInterval = 1000;

function update() {
    let now = Date.now()

    if (!ticks) {
        bugSpawnTimestamp = now - (bugSpawnInterval + 2000);

        life = 100;
        maxEnergy = 10;
        energy = maxEnergy;
        maxTongueLength = 30;
        tongueLength = 0;
        bugs = [];
        frog.caughtBug = undefined;
    }

    // water
    color('light_blue');
    rect(0, 90, 100, 10);
    color('black');
    if (input.isJustPressed) {
        play('synth', {
            freq: 400,
            volume: .2,
        });
    }

    if (input.isPressed) {
        

        let targetLength = maxTongueLength * (energy / maxEnergy);

        if (extendY < targetLength) {
            extendY += (targetLength - extendY) * .2;
        } else {
            extendY = targetLength;
        }
        extendFallFactor = 0;

        if (tongueLength < targetLength) {
            tongueLength += (targetLength - tongueLength) * .6;
        } else {
            tongueLength = targetLength;
        }

        if (energy > 0) {
            energy -= .2;
        } else {
            energy = 0;
        }
    } else {
        if (extendY > 0.1) {
            extendFallFactor += .1;
            extendY -= extendFallFactor;
        } else {
            extendY = 0;
        }

        if (tongueLength > 0.1) {
            tongueLength += (0 - tongueLength) * .1;
        }

        if (energy < maxEnergy) {
            if (!frog.isMouthOpen) {
                energy += .5;
            } else {
                energy += .2;
            }
        } else {
            energy = maxEnergy;
        }
    }

    frog.pos.x = 50 + Math.sin(ticks * .03) * 10;
    frog.pos.y = 90 + Math.cos(ticks * .03) * 0;
    frog.height = (1 + Math.sin(ticks * .05) * .2) * 20;
    frog.tongueExtension.set(Math.sin(ticks * .1) * (energy / maxEnergy) * 2, extendY);
    frog.mouthHeight = extendY / maxTongueLength * 6 + 1;

    // frog
    frog.drawBody();

    // catch bug
    if (!frog.caughtBug) {
        if (frog.isMouthOpen) {
            for (let bug of bugs) {
                if (bug.pos.distanceTo(frog.tongueTipPos) < 3 && !frog.caughtBug) {
                    frog.caughtBug = bug;
                    bug.isCaught = true;
                    play('laser');
                    break;
                }
            }
        }
        
    } else {
        if (frog.isMouthOpen) {
            frog.caughtBug.pos.set(frog.tongueTipPos);
        } else {

            // frog eat
            frog.caughtBug.isDestroyed = true;
            addScore(frog.caughtBug.score, frog.caughtBug.pos);
            play('coin');
            
            maxTongueLength += 1;
            life += frog.caughtBug.score;
            life = Math.min(100, life);
            maxEnergy += 1;

            frog.caughtBug = undefined;

        }
    }


    // bugs
    if (now - bugSpawnTimestamp > bugSpawnInterval) {
        bugSpawnTimestamp = now;
        if (bugs.length < 4) {
            spawnBug();
        }
    }

    for (let i = 0; i < bugs.length; i++) {
        let bug = bugs[i];

        if (bug.isDestroyed) {
            bugs.splice(i, 1);
            i -= 1;
        } else {
            bug.update();
            bug.draw();
        }
    }


    // frog chin
    frog.drawChin();


    // drains
    if (life > 0) {
        life -= .04 * difficulty;
    } else {
        play('explosion');
        end();
    }


    // ui stuff
    // energy bar
    let barTop = 20;
    let barBottom = 80;
    let barLength = barBottom - barTop;
    color('light_black');
    rect(5,barBottom,2,-barLength);
    color('yellow');
    rect(5,barBottom,2,-(energy / maxEnergy) * barLength);
    color('black');
    text('ENRG', 3, barBottom + 3);
    color('light_black');
    rect(93,barBottom,2,-barLength);
    color('blue');
    rect(93,barBottom,2,-(life / 100) * barLength);
    color('black');
    text('LIFE', 93 - 15, barBottom + 3);
}