let game = {};

function initGame(game) {
    game.gold = 0;
    game.balls = 0;
    game.plastic = 0;
    game.air = 0;
    game.airdt = 0;
    game.previous = {};
    game.displayTypes = getDisplayTypes();
    game.canDebt = false;
    game.pressureWarning = false;
    game.debtTimer = 0;
    game.warningTimer = 0;
    game.chapterTimer = 0;
    $id('buyBall').cooldown = 0;
    game.gold = Math.abs(game.gold);
    $id('goldDisplay').style.textShadow = 'none';
}

function updateVisible(game) {
    for (let i = 0; i < game.displayTypes.length; i++) {
        let name = game.displayTypes[i];
        if (game.previous[name] !== undefined && game[name] != game.previous[name]) $id(name + 'Display').show();
        game.previous[name] = game[name];
    }
}

function round(n, p) {
    const sh = 10 ** p;
    return Math.floor(n * sh + 0.00001) / sh;
}

function onGameUpdate(dt) {
    if (!game.death) {
        game.air += 1.7 * (game.airdt) * dt;
        game.air *= 0.75 ** dt;
        game.airdt = max(0, game.airdt - dt);
        if (game.gold >= 10) $id('buyBall').show();
        if (game.balls >= 3) $id('pop').show();
        if (game.balls >= 5) $id('overbudget').show();
        if (game.gold < 0) {
            if (game.canDebt) {
                game.gold *= 1.012 ** dt;
            } else {
                game.debtTimer += dt;
                if (game.debtTimer >= 2) game.canDebt = true;
            }
        } else game.debtTimer = 0;
        $id('buyBall').cooldown = max(0, $id('buyBall').cooldown - dt);
        if (game.air <= 1) {
            game.pressureWarning = false;
            $id('warning').hide();
        }
        if (game.air >= 1.1) game.pressureWarning = true;
        game.warningTimer = game.pressureWarning? game.warningTimer + dt * 0.4 / (1.36 - game.air) ** 1 : 0;
        if (game.air >= 1.3) {
            game.death = true;
            $id('buyBall').show();
            $id('ballsDisplay').hide();
            $id('plasticDisplay').hide();
            $id('airDisplay').hide();
            $id('debtNote').hide();
            $id('taxNote').hide();
            $id('work').hide();
            $id('pop').hide();
            $id('buyBall').hide();
            $id('overbudget').hide();
            $id('warning').hide();
            $id('root').style.backgroundImage = 'linear-gradient(#c20017, #9e001a 50%, #9e001a 88%, #000000 100%)';
            $id('chapter').show();
        }
    }
}

function ontick() {
    let dt = 1/60;

    onGameUpdate(dt);

    if (!game.death) {
        let inDebt = game.canDebt && game.gold < 0;
        updateDisplay('gold', `Gold: ${round(game.gold, 2)}`);
        updateDisplay('balls', `Balls: ${game.balls}`);
        updateDisplay('plastic', `Plastic: ${round(game.plastic, 3)}`);
        updateDisplay('air', `Air: ${round(game.air * 100, 1) + '%'}`);
        updateVisible(game);
        $id('debtNote').show(inDebt);
        $id('taxNote').show(game.balls >= 10);
        $id('buyBall').setColor(($id('buyBall').cooldown > 0)? '#ffa89e' : '#ffc39e');
        $id('buyBall').disabled = !game.canOverbudget && $id('buyBall').cooldown > 0;
        $id('warning').show(game.pressureWarning && !(Math.floor(game.warningTimer) % 2));
    } else {
        game.chapterTimer += dt;
        if (game.chapterTimer > 1.4) $id('chapter').style.opacity = (2.8 - game.chapterTimer) / (2.8 - 1.4);
        updateDisplay('gold', `Blood money: ${round(game.gold, 2)}`);
    }
}

function onMousemove(event) {
    $('tool-tip').toArray().forEach(el => {
        if (el.offsetParent) {  // visible
            let viewPos = el.getBoundingClientRect();
            el.style.left = event.pageX - viewPos.left + el.offsetLeft - el.offsetWidth / 2 + 'px';
            el.style.top = event.pageY - viewPos.top + el.offsetTop - el.offsetHeight - 10 + 'px';
        }
    });
}

window.onload = function() {
    // Formatting
    initStyle();
    $('button').toArray().forEach(el => setStateStyles(el));
    hideAll();
    $id('goldDisplay').show();
    $id('work').show();
    $id('buyBall').show();
    $id('ballsDisplay').show();
    $id('plasticDisplay').show();
    $id('airDisplay').show();

    initGame(game);
    game.balls = 175;

    $id('work').onclick = () => {
        game.gold++;
    };
    $id('pop').onclick = () => {
        if (game.balls < 1) return;
        game.balls--;
        game.plastic += 0.0173;
        game.airdt = 0.3;
    };

    $id('buyBall').onclick = () => {
        let price = 1;
        if (game.balls >= 10) price *= 1.07;
        price *= 1 + $id('buyBall').cooldown / 1.28;
        game.gold -= price;
        game.balls++;
        $id('buyBall').cooldown = 1.28;
    };

    $id('overbudget').onclick = () => {
        if (game.balls < 5) return;
        game.gold -= 100;
        game.balls -= 5;
        game.canOverbudget = true;
        $id('overbudget').style.display = 'none';
    };

    setInterval(ontick, 1000/60);
    document.addEventListener('mousemove', onMousemove, false);
}

// spring model solution for IK (FBD)