Crafty.c('hero', {
    init: function() {
        this.marginLeft = 6;

        this.requires('grid')
            .addComponent('SpriteAnimation, Tween, Collision, MoveTo')
            //.addComponent('SolidHitBox') // DEBUG
            //.addComponent('VisibleMBR') // DEBUG
            .attr({
                w: Game.components.hero.tile.width,
                h: Game.components.hero.tile.height,
                z: 4
            })
            .initReels()
            .enableKeyboard()
            .initCollision()
        ;

        this.origin('center');
    },

    /**
     * @param {Number} x
     * @param {Number} y
     * @returns {*}
     */
    at: function(x, y) {
        this.attr({
            x: x * Game.grid.tileSize - this.marginLeft,
            y: y * Game.grid.tileSize - Game.components.hero.tile.height + Game.grid.tileSize
        });
        return this;
    },

    /**
     * @returns {{x: *, y: *}}
     */
    getTile: function() {
        return {
            x: Math.floor((this.x + this.marginLeft) / Game.grid.tileSize),
            y: Math.floor((this.y + Game.components.hero.tile.height - Game.grid.tileSize) / Game.grid.tileSize)
        };
    },

    /**
     * @param {String} type
     * @returns {*}
     */
    setType: function(type) {
        this.type = type;
        return this;
    },

    /**
     * Enable keyboard commands.
     * @returns {*}
     */
    enableKeyboard: function() {
        this.unbind('KeyDown');

        this.bind('KeyDown', function(e) {
            if (this.isPlaying()) {
                return;
            }

            switch (e.key) {
                case Crafty.keys.LEFT_ARROW:
                    this.moveIt('left');
                    break;
                case Crafty.keys.RIGHT_ARROW:
                    this.moveIt('right');
                    break;
                case Crafty.keys.UP_ARROW:
                    this.moveIt('top');
                    break;
                case Crafty.keys.DOWN_ARROW:
                    this.moveIt('bottom');
                    break;
            }
        });

        return this;
    },

    /**
     * Define reels for the character
     * @returns {*}
     */
    initReels: function() {
        this.reel('walk_right',  Game.components.hero.moveDuration, Game.components.hero.animation['walk_right'])
            .reel('walk_left',   Game.components.hero.moveDuration, Game.components.hero.animation['walk_left'])
            .reel('walk_bottom', Game.components.hero.moveDuration, Game.components.hero.animation['walk_bottom'])
            .reel('walk_top',    Game.components.hero.moveDuration, Game.components.hero.animation['walk_top']);

        return this;
    },

    /**
     * Make the character stand
     * @param {String} orientation
     * @returns {*}
     */
    stand: function(orientation) {
        this.removeComponent(this.type + '--move--right');
        this.removeComponent(this.type + '--move--left');
        this.removeComponent(this.type + '--move--top');
        this.removeComponent(this.type + '--move--bottom');

        this.addComponent(this.type + '--move--' + orientation);

        return this;
    },

    /**
     * Make the character move
     * @param {String} orientation
     * @returns {*}
     */
    moveIt: function(orientation) {
        Crafty('movement').destroy();

        this.stand(orientation);

        var t = this,
            tween = {},
            oldPosition = this.getTile(),
            newPosition = this.getTile(),
            movement = Game.components.hero.movement;

        switch (orientation) {
            case 'right':
                tween.x = this.x + movement;
                newPosition.x += 1;
                break;
            case 'left':
                tween.x = this.x - movement;
                newPosition.x -= 1;
                break;
            case 'bottom':
                tween.y = this.y + movement;
                newPosition.y += 1;
                break;
            case 'top':
                tween.y = this.y - movement;
                newPosition.y -= 1;
                break;
        }

        // prevent from moving of the edge of the map
        if (newPosition.x < 0 || newPosition.x >= Game.grid.cols || newPosition.y < 0 || newPosition.y >= Game.grid.rows) {
            return;
        }

        console.log('moving from [%d, %d] tile to [%d, %d] tile', oldPosition.x, oldPosition.y, newPosition.x, newPosition.y);

        // the cell we trying to move on is unbridgeable
        if (Game.grid.objectMatrix[newPosition.y][newPosition.x] === CONST_NOT_WALKABLE) {
            return;
        }

        Game.grid.matrix[oldPosition.y][oldPosition.x] = CONST_WALKABLE;
        Game.grid.objectMatrix[oldPosition.y][oldPosition.x] = CONST_WALKABLE;
        Game.grid.matrix[newPosition.y][newPosition.x] = CONST_NOT_WALKABLE;
        Game.grid.objectMatrix[newPosition.y][newPosition.x] = CONST_TEMPORARY_NOT_WALKABLE;

        this.animate('walk_'+ orientation)
            .bind('AnimationEnd', function() {
                t.stand(orientation).unbind('AnimationEnd');
            })
            .tween(tween, Game.components.hero.moveDuration)
        ;
    },

    /**
     * @returns {*}
     */
    initCollision: function() {
        var polygon = new Crafty.polygon(
            // top left
            [this.marginLeft + 1,                      Game.components.hero.tile.height - Game.grid.tileSize + 1],
            // top right
            [this.marginLeft + Game.grid.tileSize - 1, Game.components.hero.tile.height - Game.grid.tileSize + 1],
            // bottom right
            [this.marginLeft + Game.grid.tileSize - 1, Game.components.hero.tile.height - 1],
            // bottom left
            [this.marginLeft + 1,                      Game.components.hero.tile.height - 1]
        );

        this.collision(polygon);

        return this;
    }
});
