import {
  HydratedDocument,
  Model,
  PopulateOption,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  Types,
  UpdateQuery,
} from "mongoose";

abstract class BaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
    return this.model.create(data);
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findById(id);
  }

  async findOne({
    filter,
    options,
    projection,
  }: {
    filter: QueryFilter<TDocument>;
    options?: QueryOptions<TDocument>;
    projection?: ProjectionType<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this.model
      .findOne(filter, projection)
      .sort(options?.sort)
      .skip(options?.skip!)
      .limit(options?.limit!)
      .select(options?.select)
      .populate(options?.populate as any);
  }

  async find({
    filter,
    options,
    projection,
  }: {
    filter: QueryFilter<TDocument>;
    options?: QueryOptions<TDocument>;
    projection?: ProjectionType<TDocument>;
  }): Promise<HydratedDocument<TDocument>[] | null> {
    return this.model
      .find(filter, projection)
      .sort(options?.sort)
      .skip(options?.skip!)
      .limit(options?.limit!)
      .select(options?.select)
      .populate(options?.populate as any);
  }

  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: QueryOptions<TDocument>;
  }) {
    return this.model.findOneAndUpdate(filter, update, options);
  }

  async findByIdAndUpdate({
    id,
    update,
    options,
  }: {
    id: Types.ObjectId;
    update: UpdateQuery<TDocument>;
    options: QueryOptions<TDocument>;
  }) {
    return this.model.findByIdAndUpdate(id, update, { new: true, ...options });
  }

  async findOneAndDelete({
    filter,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    options?: QueryOptions<TDocument>;
  }) {
    return this.model.findOneAndDelete(filter, options);
  }

  async paginate<T>({
    page,
    limit,
    sort,
    populate,
    search,
  }: {
    page: number;
    limit: number;
    sort?: any;
    populate?: any;
    search?: QueryFilter<T>;
  }) {
    page = +page! || 1;
    limit = +limit! || 1;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;

    const skip = (page - 1) * limit;

    const [data, totalDoc] = await Promise.all([
      await this.model
        .find({ ...(search ?? {}) })
        .limit(limit)
        .skip(skip)
        .sort(sort)
        .populate(populate)
        .exec(),
      await this.model.countDocuments({ ...(search ?? {}) }),
    ]);

    const totalPages = Math.ceil(totalDoc / limit);

    return {
      meta: {
        currentPage: page,
        totalPages,
        limit,
        totalDoc,
      },
      data,
    };
  }
}

export default BaseRepository;
