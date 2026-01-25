"""CLI commands using Typer."""

import typer
from rich.console import Console
from rich.table import Table

from .config import get_config, get_settings

app = typer.Typer(
    name="{{ cookiecutter.project_slug }}",
    help="{{ cookiecutter.project_description }}",
    add_completion=False,
    context_settings={"help_option_names": ["-h", "--help"]},
)

console = Console()


@app.command("info", help="Show application configuration")
def info(
    verbose: bool = typer.Option(False, "-v", "--verbose", help="Show all settings"),
) -> None:
    """
    Display application configuration.

    Examples:
        cli info
        cli info --verbose
        cli info -v
    """
    app_config, api_config, log_config = get_config()

    table = Table(title="{{ cookiecutter.project_name }} Configuration")
    table.add_column("Setting", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("App Name", app_config.name)
    table.add_row("Version", app_config.version)
    table.add_row("Debug", str(app_config.debug))
    table.add_row("API Port", str(api_config.port))

    if verbose:
        table.add_row("Workers", str(api_config.workers))
        table.add_row("Log Level", log_config.level)

    console.print(table)


@app.command("serve", help="Start the API server")
def serve(
    port: int = typer.Option({{ cookiecutter.backend_port }}, "-p", "--port", help="Port to listen on"),
    reload: bool = typer.Option(False, "-r", "--reload", help="Enable hot reload"),
    workers: int = typer.Option(1, "-w", "--workers", help="Number of workers"),
) -> None:
    """
    Start the FastAPI server.

    Examples:
        cli serve
        cli serve --port 8080
        cli serve -p 8080 -r
        cli serve --workers 4
    """
    import uvicorn

    console.print(f"[green]Starting server on port {port}...[/green]")
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=port,
        reload=reload,
        workers=workers if not reload else 1,
    )


@app.command("health", help="Check API health")
def health(
    url: str = typer.Option(
        "http://localhost:{{ cookiecutter.backend_port }}",
        "-u", "--url",
        help="API base URL",
    ),
) -> None:
    """
    Check if the API is healthy.

    Examples:
        cli health
        cli health --url http://localhost:8080
        cli health -u https://api.example.com
    """
    import httpx

    try:
        response = httpx.get(f"{url}/health", timeout=5)
        if response.status_code == 200:
            console.print("[green]✓ API is healthy[/green]")
            console.print(response.json())
        else:
            console.print(f"[red]✗ API returned {response.status_code}[/red]")
    except httpx.RequestError as e:
        console.print(f"[red]✗ Failed to connect: {e}[/red]")
        raise typer.Exit(1)


if __name__ == "__main__":
    app()
