import mongoose, { Schema, Types } from 'mongoose';
import { BaseDocument, SaveOptions } from '../../../types/mongoose.types';

type PlaylistType = 'public' | 'unlisted' | 'private';
type ContentType = 'video' | 'stream';

export interface IPlaylistItem {
  contentId: Types.ObjectId;
  contentType: ContentType;
  position: number;
  addedAt: Date;
  notes?: string;
}

export interface IPlaylist extends BaseDocument {
  title: string;
  description?: string;
  owner: Types.ObjectId;
  type: PlaylistType;
  thumbnail?: string;
  items: IPlaylistItem[];
  tags: string[];
  viewCount: number;
  likeCount: number;
  isFeatured: boolean;
  collaborators: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const playlistItemSchema = new Schema<IPlaylistItem>({
  contentId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    refPath: 'items.contentType'
  },
  contentType: { 
    type: String, 
    required: true,
    enum: ['video', 'stream']
  },
  position: { 
    type: Number, 
    required: true,
    min: 0 
  },
  addedAt: { 
    type: Date, 
    default: Date.now 
  },
  notes: { 
    type: String,
    trim: true,
    maxlength: 500
  }
}, { _id: false });

const playlistSchema = new Schema<IPlaylist>(
  {
    title: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    description: { 
      type: String,
      trim: true,
      maxlength: 2000
    },
    owner: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      index: true
    },
    type: { 
      type: String, 
      enum: ['public', 'unlisted', 'private'],
      default: 'public'
    },
    thumbnail: { 
      type: String,
      trim: true
    },
    items: [playlistItemSchema],
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    viewCount: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    likeCount: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    isFeatured: { 
      type: Boolean, 
      default: false 
    },
    collaborators: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
playlistSchema.index({ title: 'text', description: 'text', tags: 'text' });
playlistSchema.index({ owner: 1, type: 1 });
playlistSchema.index({ 'items.contentId': 1, 'items.contentType': 1 });
playlistSchema.index({ viewCount: -1 });
playlistSchema.index({ likeCount: -1 });

// Virtual para a URL da playlist
playlistSchema.virtual('url').get(function(this: IPlaylist) {
  return `/playlist/${this._id}`;
});

// Middleware para garantir que a posição dos itens seja única e sequencial
playlistSchema.pre('save', function() {
  const playlist = this as unknown as IPlaylist;
  
  if (!playlist.items || !playlist.items.length) return;
  
  // Ordena os itens por posição atual
  playlist.items.sort((a, b) => a.position - b.position);
  
  // Atualiza as posições para serem sequenciais
  playlist.items.forEach((item, index) => {
    item.position = index + 1;
  });
});

// Add proper save method with SaveOptions
declare module 'mongoose' {
  interface Document {
    save(options?: SaveOptions): Promise<this>;
  }
}

// Método para adicionar um item à playlist
playlistSchema.methods.addItem = function(
  contentId: Types.ObjectId, 
  contentType: ContentType, 
  position?: number,
  notes?: string
) {
  // Se a posição não for fornecida, adiciona ao final
  const itemPosition = position !== undefined ? position : this.items.length + 1;
  
  // Se a posição for maior que o tamanho atual, ajusta para o final
  const finalPosition = Math.min(itemPosition, this.items.length + 1);
  
  // Desloca os itens seguintes para baixo
  this.items.forEach(item => {
    if (item.position >= finalPosition) {
      item.position += 1;
    }
  });
  
  // Adiciona o novo item
  this.items.push({
    contentId,
    contentType,
    position: finalPosition,
    addedAt: new Date(),
    notes
  });
  
  return this.save();
};

// Método para remover um item da playlist
playlistSchema.methods.removeItem = function(itemId: Types.ObjectId | string) {
  const itemToRemove = this.items.find(item => 
    item._id ? item._id.toString() === itemId.toString() : false
  );
  
  if (!itemToRemove) return Promise.resolve(this);
  
  const positionToRemove = itemToRemove.position;
  
  // Remove o item
  this.items = this.items.filter(item => 
    item._id ? item._id.toString() !== itemId.toString() : false
  );
  
  // Ajusta as posições dos itens restantes
  this.items.forEach(item => {
    if (item.position > positionToRemove) {
      item.position -= 1;
    }
  });
  
  return this.save();
};

// Método para mover um item na playlist
playlistSchema.methods.moveItem = function(
  itemId: Types.ObjectId | string, 
  newPosition: number
) {
  if (newPosition < 1 || newPosition > this.items.length) {
    throw new Error('Posição inválida');
  }
  
  const itemToMove = this.items.find(item => 
    item._id ? item._id.toString() === itemId.toString() : false
  );
  
  if (!itemToMove) {
    throw new Error('Item não encontrado na playlist');
  }
  
  const oldPosition = itemToMove.position;
  
  if (oldPosition === newPosition) {
    return Promise.resolve(this);
  }
  
  // Atualiza as posições dos outros itens
  this.items.forEach(item => {
    if (item._id?.toString() !== itemId.toString()) {
      if (oldPosition < newPosition && item.position > oldPosition && item.position <= newPosition) {
        // Movendo para baixo
        item.position -= 1;
      } else if (oldPosition > newPosition && item.position >= newPosition && item.position < oldPosition) {
        // Movendo para cima
        item.position += 1;
      }
    }
  });
  
  // Atualiza a posição do item movido
  itemToMove.position = newPosition;
  
  return this.save();
};

const Playlist = mongoose.model<IPlaylist>('Playlist', playlistSchema);

export default Playlist;
