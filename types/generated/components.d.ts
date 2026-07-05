import type { Schema, Struct } from '@strapi/strapi';

export interface ProgrammeItem extends Struct.ComponentSchema {
  collectionName: 'components_programme_items';
  info: {
    displayName: 'Programme Item';
    icon: 'calendar';
  };
  attributes: {
    description: Schema.Attribute.String;
    time: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface RsvpGuest extends Struct.ComponentSchema {
  collectionName: 'components_rsvp_guests';
  info: {
    displayName: 'Guest';
    icon: 'user';
  };
  attributes: {
    ageGroup: Schema.Attribute.Enumeration<['adult', 'child', 'baby']> &
      Schema.Attribute.DefaultTo<'adult'>;
    allergies: Schema.Attribute.Text;
    attending: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    firstName: Schema.Attribute.String;
    lastName: Schema.Attribute.String;
    mealChoice: Schema.Attribute.Enumeration<
      ['standard', 'vegetarian', 'vegan', 'glutenFree']
    >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'programme.item': ProgrammeItem;
      'rsvp.guest': RsvpGuest;
    }
  }
}
