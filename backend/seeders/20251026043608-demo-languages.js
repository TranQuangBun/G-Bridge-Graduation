module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "languages",
      [
        {
          id: 1,
          name: "English",
          code: "en",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Vietnamese",
          code: "vi",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          name: "French",
          code: "fr",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 4,
          name: "Spanish",
          code: "es",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 5,
          name: "Chinese",
          code: "zh",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 6,
          name: "Japanese",
          code: "ja",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 7,
          name: "Korean",
          code: "ko",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("languages", null, {});
  },
};
