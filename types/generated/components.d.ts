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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'programme.item': ProgrammeItem;
    }
  }
}
