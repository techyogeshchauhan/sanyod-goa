import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

/** Videos inside a course (PHP: rows returned by get_videos.php?subject_id=). */
const courseVideoSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    /** YouTube video ID only (e.g. ey3lX6OpVps); the embed URL is built by the client. */
    youtubeId: { type: String, required: true, trim: true, match: /^[\w-]{6,20}$/ },
    isFree: { type: Boolean, default: false }, // data-free=1
    sortOrder: { type: Number, default: 0 },
    durationSec: { type: Number, min: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

courseVideoSchema.index({ course: 1, sortOrder: 1 });

export type CourseVideoAttrs = InferSchemaType<typeof courseVideoSchema>;
export type CourseVideoDoc = HydratedDocument<CourseVideoAttrs>;
export const CourseVideo = model('CourseVideo', courseVideoSchema);
