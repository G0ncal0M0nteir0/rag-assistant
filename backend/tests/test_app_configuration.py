from pathlib import Path


def test_app_startup_does_not_create_tables_implicitly():
    main_source = Path("app/main.py").read_text(encoding="utf-8")

    assert "create_all" not in main_source


def test_readme_mentions_migration_step():
    readme = Path("../README.md").read_text(encoding="utf-8")

    assert "alembic upgrade head" in readme
