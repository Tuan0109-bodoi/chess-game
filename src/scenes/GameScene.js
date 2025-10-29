import { Chess } from "chess.js";

export default class GameScene extends Phaser.Scene {
  preload() {
    // Load quân cờ
    const pieces = ["p", "r", "n", "b", "q", "k"];
    for (const p of pieces) {
      this.load.image("w" + p, "assets/pieces/w" + p + ".png");
      this.load.image("b" + p, "assets/pieces/b" + p + ".png");
    }

    // Load ảnh bàn cờ
    this.load.image("board", "assets/board.png");

    // Load icon cờ trắng (nếu có)
    // this.load.image("flag", "assets/flag.png");
  }

  // Hiển thị dialog chọn phong cấp (queen/knight/rook/bishop) - sidebar style
  showPromotionDialog(from, to, pawnSprite) {
    // Nếu đã có dialog thì ignore
    if (this.promotionContainer) return;

    const piece = this.chess.get(from);
    const colorPrefix = piece && piece.color === 'w' ? 'w' : 'b';

    // 4 quân: Xe, Hậu, Tịnh, Mã (order theo ảnh)
    const opts = ['q', 'r', 'b', 'n'];
    const boxSize = this.tileSize;

    // Vị trí: dính vào ô pawn
    const containerX = pawnSprite.col * this.tileSize;
    const isWhite = colorPrefix === 'w';

    // Trắng: stack từ dưới lên (pawn row là bottom)
    // Đen: stack từ trên xuống (pawn row là top)
    let startY;
    if (isWhite) {
      // Trắng có 4 ô, stack lên trên 3 ô
      startY = pawnSprite.row * this.tileSize - boxSize * 3;
    } else {
      // Đen có 4 ô, xuất hiện ngay dưới pawn
      startY = pawnSprite.row * this.tileSize + boxSize;
    }

    const container = this.add.container(containerX, startY).setDepth(100);

    // Background trắng với shadow
    const bgWidth = boxSize;
    const bgHeight = boxSize * opts.length;

    // Shadow đậm (offset 3px xuống và sang phải)
    const shadowGraphics = this.add.graphics();
    shadowGraphics.fillStyle(0x000000, 0.3);
    shadowGraphics.fillRoundedRect(3, 3, bgWidth, bgHeight, 3);

    // Background trắng
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(0xffffff, 1);
    bgGraphics.fillRoundedRect(0, 0, bgWidth, bgHeight, 3);

    // Border nhẹ
    bgGraphics.lineStyle(1, 0xdddddd, 1);
    bgGraphics.strokeRoundedRect(0, 0, bgWidth, bgHeight, 3);

    container.add(shadowGraphics);
    container.add(bgGraphics);

    // Divider giữa các ô
    const dividerGraphics = this.add.graphics();
    dividerGraphics.lineStyle(1, 0xeeeeee, 1);
    for (let i = 1; i < opts.length; i++) {
      const divY = i * boxSize;
      dividerGraphics.lineBetween(0, divY, bgWidth, divY);
    }
    container.add(dividerGraphics);

    for (let i = 0; i < opts.length; i++) {
      const key = colorPrefix + opts[i];
      const y = i * boxSize;

      // Highlight vàng khi hover
      const highlightGraphics = this.add.graphics();
      highlightGraphics.fillStyle(0xf7f769, 0.4);
      highlightGraphics.fillRect(0, y, boxSize, boxSize);
      highlightGraphics.setVisible(false);

      // Icon - to hơn (80% thay vì 65%)
      const icon = this.add.image(boxSize / 2, y + boxSize / 2, key)
        .setScale(boxSize * 0.8 / 150)
        .setInteractive({ cursor: 'pointer' });

      // Hover effect
      icon.on('pointerover', () => {
        highlightGraphics.setVisible(true);
        icon.setScale(boxSize * 0.85 / 150); // phóng to nhẹ
      });

      icon.on('pointerout', () => {
        highlightGraphics.setVisible(false);
        icon.setScale(boxSize * 0.8 / 150);
      });

      icon.on('pointerdown', () => {
        // Click effect
        this.tweens.add({
          targets: icon,
          scale: boxSize * 0.75 / 150,
          duration: 60,
          yoyo: true,
          onComplete: () => {
            this.performPromotion(from, to, pawnSprite, opts[i]);
          }
        });
      });

      container.add(highlightGraphics);
      container.add(icon);
    }

    // Fade in animation
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 120,
      ease: 'Power2'
    });

    this.promotionContainer = container;
  }

  performPromotion(from, to, pawnSprite, promotionPiece) {
    // Remove dialog
    if (this.promotionContainer) {
      this.promotionContainer.destroy(true);
      this.promotionContainer = null;
    }

    try {
      // Call chess.move with selected promotion
      const move = this.chess.move({ from, to, promotion: promotionPiece });
      if (!move) {
        console.warn('Promotion move invalid', from, to, promotionPiece);
        return;
      }

      // If there is a captured piece at destination, destroy it
      if (move.captured) {
        const capturedSprite = this.pieces[to];
        if (capturedSprite && capturedSprite !== pawnSprite) {
          capturedSprite.destroy();
        }
      }

      // Update pawn sprite to new piece texture
      const colorPrefix = move.color === 'w' ? 'w' : 'b';
      const texKey = colorPrefix + promotionPiece;
      pawnSprite.setTexture(texKey);

      // Move pawn sprite to destination
      this.movePiece(pawnSprite, this.squareToCoord(to).row, this.squareToCoord(to).col);

      // Update pieces map
      delete this.pieces[from];
      this.pieces[to] = pawnSprite;

    } catch (err) {
      console.error('Error performing promotion', err);
    }
  }

  create() {
    // Khởi tạo chess.js
    this.chess = new Chess();
    this.selectedPiece = null;
    this.highlightGraphics = this.add.graphics();
    this.highlightGraphics.setDepth(1); // Đặt trên board nhưng dưới pieces
    this.pieces = {}; // Lưu trữ sprite theo square
    this.tileSize = 80;

    // Hiển thị bàn cờ
    const board = this.add.image(0, 0, "board").setOrigin(0);
    board.setDisplaySize(this.scale.width, this.scale.height);
    board.setDepth(0);

    // Thêm interactive cho board để bắt click vào ô trống
    board.setInteractive();
    board.on('pointerdown', (pointer) => {
      if (this.selectedPiece) {
        const col = Math.floor(pointer.x / this.tileSize);
        const row = Math.floor(pointer.y / this.tileSize);
        if (col >= 0 && col < 8 && row >= 0 && row < 8) {
          this.tryMove(this.selectedPiece, row, col);
        }
      }
    });

    // Vị trí ban đầu
    const startPosition = [
      ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
      ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
      ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
    ];

    const pieceScale = 80 / 150;
    // Render quân cờ
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = startPosition[row][col];
        if (piece) {
          const sprite = this.add
            .image(
              col * this.tileSize + this.tileSize / 2,
              row * this.tileSize + this.tileSize / 2,
              piece
            )
            .setOrigin(0.5)
            .setScale(pieceScale)
            .setDepth(2);

          sprite.row = row;
          sprite.col = col;
          sprite.setInteractive(); // cho phép click
          sprite.on("pointerdown", () => {
            this.onPieceClick(sprite);
          });

          // Lưu sprite vào map
          const square = this.coordToSquare(row, col);
          this.pieces[square] = sprite;
        }
      }
    }
  }
  onPieceClick(sprite) {
    const square = this.coordToSquare(sprite.row, sprite.col);

    // Nếu đã chọn quân, thử di chuyển đến vị trí này
    if (this.selectedPiece && this.selectedPiece !== sprite) {
      this.tryMove(this.selectedPiece, sprite.row, sprite.col);
      return;
    }

    // Chọn quân mới
    this.selectedPiece = sprite;
    this.highlightLegalMoves(square);
    console.log("Selected", square);
  }

  highlightLegalMoves(square) {
    this.highlightGraphics.clear();
    const moves = this.chess.moves({ square, verbose: true });

    // Highlight ô được chọn - màu vàng nhạt
    this.highlightGraphics.fillStyle(0xf7f769, 0.5);
    this.highlightGraphics.fillRect(
      this.selectedPiece.col * this.tileSize,
      this.selectedPiece.row * this.tileSize,
      this.tileSize,
      this.tileSize
    );

    // Highlight các nước đi hợp lệ
    moves.forEach(move => {
      const { row, col } = this.squareToCoord(move.to);
      const centerX = col * this.tileSize + this.tileSize / 2;
      const centerY = row * this.tileSize + this.tileSize / 2;

      // Kiểm tra nếu là nước nhập thành
      if (move.flags.includes('k') || move.flags.includes('q')) {
        // Nhập thành - vẽ 2 chấm tròn
        this.highlightGraphics.fillStyle(0x000000, 0.2);

        // Chấm tròn bên trái
        this.highlightGraphics.fillCircle(
          centerX - this.tileSize / 6,
          centerY,
          this.tileSize / 8
        );

        // Chấm tròn bên phải
        this.highlightGraphics.fillCircle(
          centerX + this.tileSize / 6,
          centerY,
          this.tileSize / 8
        );
      } else if (move.captured || this.pieces[move.to]) {
        // Nước ăn quân - vẽ vòng tròn bao quanh
        this.highlightGraphics.lineStyle(this.tileSize / 10, 0x000000, 0.2);
        this.highlightGraphics.strokeCircle(
          centerX,
          centerY,
          this.tileSize * 0.42
        );
      } else {
        // Nước đi thông thường - vẽ chấm tròn ở giữa
        this.highlightGraphics.fillStyle(0x000000, 0.2);
        this.highlightGraphics.fillCircle(
          centerX,
          centerY,
          this.tileSize / 4
        );
      }
    });
  }

  tryMove(sprite, toRow, toCol) {
    const from = this.coordToSquare(sprite.row, sprite.col);
    const to = this.coordToSquare(toRow, toCol);

    console.log("Trying to move from", from, "to", to);

    try {
      // Determine if this move is a pawn promotion candidate
      const movingPiece = this.chess.get(from);
      const isPawn = movingPiece && movingPiece.type === 'p';
      const promotionRowForWhite = 0;
      const promotionRowForBlack = 7;

      // If pawn reaches last rank, show promotion UI to let user choose
      if (isPawn && ((movingPiece.color === 'w' && toRow === promotionRowForWhite) || (movingPiece.color === 'b' && toRow === promotionRowForBlack))) {
        // Show promotion dialog; actual move will be performed after selection
        this.showPromotionDialog(from, to, sprite);
        return;
      }

      // Normal move (no promotion) - perform move without forcing promotion
      const move = this.chess.move({ from, to });

      if (move) {
        console.log("Move successful:", move);
        // Xử lý nhập thành (castling)
        if (move.flags.includes('k') || move.flags.includes('q')) {
          console.log("Castling detected!");

          // Di chuyển vua
          this.movePiece(sprite, toRow, toCol);

          // Tìm và di chuyển xe
          let rookFromCol, rookToCol;
          if (move.flags.includes('k')) {
            // Nhập thành cánh vua (kingside)
            rookFromCol = 7;
            rookToCol = 5;
          } else {
            // Nhập thành cánh hậu (queenside)
            rookFromCol = 0;
            rookToCol = 3;
          }

          const rookFromSquare = this.coordToSquare(toRow, rookFromCol);
          const rookSprite = this.pieces[rookFromSquare];

          if (rookSprite) {
            this.movePiece(rookSprite, toRow, rookToCol);

            // Cập nhật pieces map cho xe
            const rookToSquare = this.coordToSquare(toRow, rookToCol);
            delete this.pieces[rookFromSquare];
            this.pieces[rookToSquare] = rookSprite;
          }
        } else {
          // Nước đi thông thường

          // Xóa quân bị ăn trước
          if (move.captured) {
            const capturedPiece = this.pieces[to];
            if (capturedPiece && capturedPiece !== sprite) {
              capturedPiece.destroy();
            }
          }

          // Di chuyển sprite
          this.movePiece(sprite, toRow, toCol);
        }

        // Cập nhật pieces map cho quân vừa di chuyển
        delete this.pieces[from];
        this.pieces[to] = sprite;

        // Kiểm tra chiếu/chiếu hết
        if (this.chess.isCheckmate()) {
          console.log("Checkmate!");
          this.showCheckmateFlag(sprite);

          setTimeout(() => {
            alert("Checkmate! " + (this.chess.turn() === 'w' ? 'Black' : 'White') + " wins!");
          }, 500);
        } else if (this.chess.isCheck()) {
          console.log("Check!");
        }
      }
    } catch (error) {
      console.log("Invalid move from", from, "to", to, error.message);
    }

    // Reset selection
    this.selectedPiece = null;
    this.highlightGraphics.clear();
  }

  movePiece(sprite, toRow, toCol) {
    sprite.row = toRow;
    sprite.col = toCol;

    // Tween animation
    this.tweens.add({
      targets: sprite,
      x: toCol * this.tileSize + this.tileSize / 2,
      y: toRow * this.tileSize + this.tileSize / 2,
      duration: 200,
      ease: 'Power2'
    });
  }

  coordToSquare(row, col) {
    // Chuyển từ (row, col) sang ký hiệu chess như "e2", "e4"
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    return files[col] + (8 - row);
  }

  squareToCoord(square) {
    // Chuyển từ "e2" sang {row, col}
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const col = files.indexOf(square[0]);
    const row = 8 - parseInt(square[1]);
    return { row, col };
  }

  showCheckmateFlag(lastMovedPiece) {
    // Tìm vua bị chiếu hết
    const losingColor = this.chess.turn(); // Màu hiện tại (bị thua)
    const kingPiece = losingColor === 'w' ? 'wk' : 'bk';

    // Tìm vị trí vua trong pieces
    let kingSprite = null;
    for (const [square, sprite] of Object.entries(this.pieces)) {
      if (sprite.texture.key === kingPiece) {
        kingSprite = sprite;
        break;
      }
    }

    if (kingSprite) {
      // Vẽ icon cờ trắng bằng graphics (nếu không có ảnh)
      const flagGraphics = this.add.graphics();
      flagGraphics.setDepth(3); // Trên cùng

      const flagX = kingSprite.x - this.tileSize / 4;
      const flagY = kingSprite.y - this.tileSize / 3;
      const flagSize = this.tileSize / 2;

      // Vẽ cột cờ (đen)
      flagGraphics.fillStyle(0x000000, 1);
      flagGraphics.fillRect(flagX, flagY, 3, flagSize);

      // Vẽ lá cờ (trắng với viền đen)
      flagGraphics.fillStyle(0xffffff, 1);
      flagGraphics.beginPath();
      flagGraphics.moveTo(flagX + 3, flagY);
      flagGraphics.lineTo(flagX + flagSize * 0.7, flagY + flagSize * 0.15);
      flagGraphics.lineTo(flagX + 3, flagY + flagSize * 0.3);
      flagGraphics.closePath();
      flagGraphics.fillPath();

      // Viền đen cho lá cờ
      flagGraphics.lineStyle(1, 0x000000, 1);
      flagGraphics.strokePath();

      // Animation lắc lắc
      this.tweens.add({
        targets: flagGraphics,
        rotation: 0.1,
        duration: 200,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.easeInOut'
      });
    }
  }
}