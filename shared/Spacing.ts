import { Entity, Fields, type FieldOptions } from 'remult';

function DoubleArray<Spacing>(...options: FieldOptions<Spacing, string>[]) {
  return Fields.json<Spacing, number[]>({
    allowNull: true,
    valueConverter: {
      fieldTypeInDb: 'double precision[]',
      toDb: (value: number[]) => {
        // const valArr = value.split(',').map(Number);
        // Convert JavaScript array to PostgreSQL array syntax {1,2,3}
        return '{' + value.join(',') + '}';
      },
    },
    validate: (spacing) => validateChangeOnAndSpacings(spacing),
    ...options,
  });
}

function validateChangeOnAndSpacings(spacing: Spacing) {
  let change_on: number[] = [];
  let spacings: number[] = [];
  if (spacing.change_on && spacing.spacings) {
    // console.log(typeof spacing.spacings)
    // console.log(typeof spacing.change_on)
    if (typeof spacing.change_on === 'string') {
      change_on = spacing.change_on.split(',').map(Number);
    } else {
      change_on = spacing.change_on;
    }

    if (typeof spacing.spacings === 'string') {
      spacings = spacing.spacings.split(',').map(Number);
    } else {
      spacings = spacing.spacings;
    }

    if (change_on.length != spacings.length) {
      throw new Error('Change on and spacings must be the same length');
    } else {
      return true;
    }
  }
}

@Entity<Spacing>('spacing', {
  allowApiCrud: true,
  allowApiDelete: 'admin',
})
export class Spacing {
  @Fields.uuid()
  id = '';

  @Fields.string({
    required: true,
  })
  title = '';

  @Fields.boolean()
  completed = false;

  @Fields.createdAt()
  createdAt?: Date;

  @DoubleArray()
  change_on?: number[] = [];

  @DoubleArray()
  spacings?: number[] = [];
}
